import type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  AuthRepository,
  PasswordHasher,
  TokenGenerator,
  SessionRepository,
  AuthToken,
} from "../domain";
import type { OrganizationRepository } from "@modules/organization/domain";
import type { WorkflowRepository } from "@modules/workflow/domain";
import type { RoleUseCases } from "@modules/roles/application";
import { invalidCredentials } from "@shared/errors" 
import type { RefreshTokenService } from "../infrastructure";

export class AuthUseCases {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly organizationRepository: OrganizationRepository,
    private readonly workflowRepository: WorkflowRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly roleUseCases: RoleUseCases,
  ) {}

  async register(data: RegisterDTO): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create organization for the new user
    const organization = await this.organizationRepository.create({
      name: `${data.name}'s Organization`,
    });

    // Create default workflow for the organization
    await this.workflowRepository.create({
      organizationId: organization.id,
      name: "Sales Pipeline",
      stages: [
        { name: "Lead", order: 1, color: "#6B7280" },
        { name: "Qualified", order: 2, color: "#3B82F6" },
        { name: "Proposal", order: 3, color: "#8B5CF6" },
        { name: "Negotiation", order: 4, color: "#F59E0B" },
        { name: "Won", order: 5, color: "#10B981" },
        { name: "Lost", order: 6, color: "#EF4444" },
      ],
    });

    const hashedPassword = await this.passwordHasher.hash(data.password);
    const roles = await this.roleUseCases.ensureDefaultRoles(organization.id);
    const adminRole = roles.find((role) => role.name === "Admin") ?? null;

    const user = await this.authRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      hashedPassword,
      organizationId: organization.id,
      roleId: adminRole?.id ?? null,
    });

    const token = this.tokenGenerator.generate(user.id, organization.id, user.roleId ?? null);

    const refresh = this.refreshTokenService.generate();
    await this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        roleId: user.roleId ?? null,
        role: user.role ?? null,
      },
      token,
      refreshToken: refresh.token,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await this.authRepository.findByEmail(data.email);
    if (!user) {
      throw invalidCredentials("User or password is incorrect");
    }

    const isValidPassword = await this.passwordHasher.verify(
      data.password,
      user.password,
    );
    if (!isValidPassword) {
      console.warn("[AUTH] Invalid login attempt", {
        email: data.email,
      });
      throw invalidCredentials("User or password is incorrect");
    }

    if (!user.organizationId) {
      throw new Error("User has no organization");
    }

    let roleId = user.roleId
    if (!roleId && user.organizationId) {
      const roles = await this.roleUseCases.ensureDefaultRoles(user.organizationId);
      const adminRole = roles.find((role) => role.name === "Admin") ?? null;
      if (adminRole) {
        const updated = await this.authRepository.updateRole(user.id, adminRole.id);
        roleId = updated?.roleId ?? adminRole.id;
        user.role = updated?.role ?? user.role;
      }
    }

    const token = this.tokenGenerator.generate(user.id, user.organizationId, roleId ?? null);
    const refresh = this.refreshTokenService.generate();
    await this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
    });

    console.info("[AUTH] User logged in:", {
      user: user.id,
      organization: user.organizationId,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
        roleId: roleId ?? null,
        role: user.role ?? null,
      },
      token,
      refreshToken: refresh.token,
    };
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ token: AuthToken; refreshToken: string }> {
    const hash = this.refreshTokenService.hash(refreshToken);

    const session =
      await this.sessionRepository.findActiveByRefreshTokenHash(hash);
    if (!session) {
      console.warn("[AUTH] Invalid refresh token attempt");
      throw new Error("Invalid refresh token");
    }

    // Load user to get organizationId for token generation
    const user = await this.authRepository.findById(session.userId);
    if (!user || !user.organizationId) {
      throw new Error("User not found or has no organization");
    }

    // Rotate: revoke current session and create a new one
    await this.sessionRepository.revoke(session.id);

    const newRefresh = this.refreshTokenService.generate();
    await this.sessionRepository.create({
      userId: session.userId,
      refreshTokenHash: newRefresh.hash,
      expiresAt: newRefresh.expiresAt,
    });
    const token = this.tokenGenerator.generate(user.id, user.organizationId, user.roleId ?? null);

    console.info("[AUTH] Session refreshed", {
      userId: user.id,
    });

    return {
      token,
      refreshToken: newRefresh.token,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = this.refreshTokenService.hash(refreshToken);
    const session =
      await this.sessionRepository.findActiveByRefreshTokenHash(hash);
    if (!session) {
      return;
    }
    console.info('[AUTH] User logged out', {
      userId: session.userId,
    });
    await this.sessionRepository.revoke(session.id);
  }
}
