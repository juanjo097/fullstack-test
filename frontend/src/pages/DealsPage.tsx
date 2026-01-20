import { useEffect, useState, type DragEvent } from "react";
import { z } from "zod";
import {
  dealService,
  workflowService,
  contactService,
  type Deal,
  type Stage,
  type Contact,
  notify,
} from "../services";
import {
  getFormErrors,
  sanitizeFilters,
  type FilterLogic,
  type ListFilter,
  type SortOption,
} from "../utils";

type ViewMode = "kanban" | "table";

const dealSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  value: z
    .string()
    .trim()
    .min(1, "Value is required")
    .refine((val) => {
      const numberValue = Number(val);
      return !Number.isNaN(numberValue) && numberValue >= 0;
    }, "Value must be 0 or more"),
});

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    value: "",
    contactId: "",
    stageId: "",
  });
  const [errors, setErrors] = useState<{ title?: string; value?: string }>({});
  const [touched, setTouched] = useState({ title: false, value: false });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [filters, setFilters] = useState<ListFilter[]>([
    { field: "title", operator: "contains", value: "" },
  ]);
  const [logic, setLogic] = useState<FilterLogic>("and");
  const [sort, setSort] = useState<SortOption[]>([
    { field: "createdAt", direction: "desc" },
  ]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [savedFilterName, setSavedFilterName] = useState("");
  const [savedFilters, setSavedFilters] = useState<
    Array<{ name: string; filters: ListFilter[]; sort: SortOption[]; logic: FilterLogic }>
  >(() => {
    const stored = localStorage.getItem("dealsSavedFilters");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    loadDeals();
  }, [page, limit, filters, sort, logic]);

  async function loadStaticData() {
    try {
      const [workflowsResponse, contactsResponse] = await Promise.all([
        workflowService.getAll({ limit: 50, sort: [{ field: "createdAt", direction: "desc" }] }),
        contactService.getAll({ limit: 100, sort: [{ field: "name", direction: "asc" }] }),
      ]);
      setStages(workflowsResponse.data[0]?.stages || []);
      setContacts(contactsResponse.data);
    } catch (error) {
      console.error("Failed to load reference data:", error);
    }
  }

  async function loadDeals() {
    try {
      setLoading(true);
      const response = await dealService.getAll({
        page,
        limit,
        filters: sanitizeFilters(filters),
        sort,
        logic,
      });
      setDeals(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to load deals:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateFilters(nextFilters: ListFilter[]) {
    setFilters(nextFilters);
    setPage(1);
  }

  function updateSort(nextSort: SortOption[]) {
    setSort(nextSort);
    setPage(1);
  }

  function handleAddFilter() {
    updateFilters([
      ...filters,
      { field: "title", operator: "contains", value: "" },
    ]);
  }

  function handleRemoveFilter(index: number) {
    const next = filters.filter((_, idx) => idx !== index);
    updateFilters(
      next.length ? next : [{ field: "title", operator: "contains", value: "" }],
    );
  }

  function handleSaveFilter() {
    const trimmed = savedFilterName.trim();
    if (!trimmed) return;
    const nextFilters = sanitizeFilters(filters);
    const payload = { name: trimmed, filters: nextFilters, sort, logic };
    const updated = [...savedFilters.filter((f) => f.name !== trimmed), payload];
    setSavedFilters(updated);
    localStorage.setItem("dealsSavedFilters", JSON.stringify(updated));
    setSavedFilterName("");
  }

  function handleApplySavedFilter(name: string) {
    const saved = savedFilters.find((entry) => entry.name === name);
    if (!saved) return;
    setFilters(saved.filters.length ? saved.filters : [{ field: "title", operator: "contains", value: "" }]);
    setSort(saved.sort.length ? saved.sort : [{ field: "createdAt", direction: "desc" }]);
    setLogic(saved.logic);
    setPage(1);
  }

  function handleDeleteSavedFilter(name: string) {
    const updated = savedFilters.filter((entry) => entry.name !== name);
    setSavedFilters(updated);
    localStorage.setItem("dealsSavedFilters", JSON.stringify(updated));
  }

  function handleHeaderSort(field: string) {
    const existing = sort.find((entry) => entry.field === field);
    if (!existing) {
      updateSort([{ field, direction: "asc" }, ...sort]);
      return;
    }
    const nextDirection = existing.direction === "asc" ? "desc" : "asc";
    updateSort(
      [{ field, direction: nextDirection }, ...sort.filter((entry) => entry.field !== field)],
    );
  }

  function handleClearFilters() {
    setFilters([{ field: "title", operator: "contains", value: "" }]);
    setLogic("and");
    setSort([{ field: "createdAt", direction: "desc" }]);
    setPage(1);
  }

  function openCreateForm(stageId?: string) {
    setFormData({
      title: "",
      value: "",
      contactId: "",
      stageId: stageId || stages[0]?.id || "",
    });
    setErrors({});
    setTouched({ title: false, value: false });
    setEditingDeal(null);
    setShowForm(true);
  }

  function openEditForm(deal: Deal) {
    setFormData({
      title: deal.title,
      value: deal.value.toString(),
      contactId: deal.contactId || "",
      stageId: deal.stageId || "",
    });
    setErrors({});
    setTouched({ title: false, value: false });
    setEditingDeal(deal);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const validationErrors = getFormErrors(dealSchema, {
      title: formData.title,
      value: formData.value,
    });
    if (Object.keys(validationErrors).length > 0) {
      setTouched({ title: true, value: true });
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    try {
      const data = {
        title: formData.title,
        value: Number(formData.value),
        contactId: formData.contactId || undefined,
        stageId: formData.stageId || undefined,
      };

      if (editingDeal) {
        await dealService.update(editingDeal.id, data);
        notify.success("The deal was updated successfully");
      } else {
        await dealService.create(data);
        notify.success("The deal was created successfully");
      }
      await loadDeals();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save deal:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    try {
      await dealService.delete(id);
      notify.success("The deal was deleted successfully");
      await loadDeals();
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  }

  async function handleStageChange(dealId: string, stageId: string) {
    try {
      // Optimistic update
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stageId } : d)),
      );
      await dealService.update(dealId, { stageId });
      notify.success("The deal stage was updated successfully");
    } catch (error) {
      console.error("Failed to update deal stage:", error);
      await loadDeals(); // Revert on error
    }
  }

  function getContactName(contactId: string | null) {
    return contacts.find((c) => c.id === contactId)?.name || null;
  }

  function getDealsByStage(stageId: string) {
    return deals.filter((d) => d.stageId === stageId);
  }

  function getStageTotal(stageId: string) {
    return getDealsByStage(stageId).reduce((sum, d) => sum + d.value, 0);
  }

  // Drag and drop handlers
  function handleDragStart(e: DragEvent<HTMLDivElement>, deal: Deal) {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, stageId: string) {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stageId !== stageId) {
      handleStageChange(draggedDeal.id, stageId);
    }
    setDraggedDeal(null);
  }

  function handleDragEnd() {
    setDraggedDeal(null);
  }

  const filterFields = [
    { value: "title", label: "Title" },
    { value: "status", label: "Status" },
    { value: "value", label: "Value" },
    { value: "contactId", label: "Contact" },
    { value: "stageId", label: "Stage" },
    { value: "createdAt", label: "Created date" },
  ];

  const filterOperators = [
    { value: "contains", label: "Contains" },
    { value: "eq", label: "Equals" },
    { value: "gt", label: "Greater than" },
    { value: "gte", label: "Greater or equal" },
    { value: "lt", label: "Less than" },
    { value: "lte", label: "Less or equal" },
  ];

  const sortFields = [
    { value: "title", label: "Title" },
    { value: "value", label: "Value" },
    { value: "status", label: "Status" },
    { value: "createdAt", label: "Created date" },
  ];

  const activeFilters = sanitizeFilters(filters);

  if (loading) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 mt-1">Track your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-1 bg-white">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => openCreateForm()}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
          >
            Add Deal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingDeal ? "Edit Deal" : "New Deal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const nextFormData = { ...formData, title: e.target.value };
                    setFormData(nextFormData);
                    if (touched.title) {
                      setErrors(
                        getFormErrors(dealSchema, {
                          title: nextFormData.title,
                          value: nextFormData.value,
                        }),
                      );
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, title: true }));
                    setErrors(
                      getFormErrors(dealSchema, {
                        title: formData.title,
                        value: formData.value,
                      }),
                    );
                  }}
                  required
                  aria-invalid={touched.title && !!errors.title}
                  aria-describedby={
                    touched.title && errors.title
                      ? "deal-title-error"
                      : undefined
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    touched.title && errors.title
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {touched.title && errors.title && (
                  <p
                    id="deal-title-error"
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.title}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Value ($)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => {
                    const nextFormData = { ...formData, value: e.target.value };
                    setFormData(nextFormData);
                    if (touched.value) {
                      setErrors(
                        getFormErrors(dealSchema, {
                          title: nextFormData.title,
                          value: nextFormData.value,
                        }),
                      );
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, value: true }));
                    setErrors(
                      getFormErrors(dealSchema, {
                        title: formData.title,
                        value: formData.value,
                      }),
                    );
                  }}
                  required
                  min="0"
                  aria-invalid={touched.value && !!errors.value}
                  aria-describedby={
                    touched.value && errors.value
                      ? "deal-value-error"
                      : undefined
                  }
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    touched.value && errors.value
                      ? "border-red-300 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                />
                {touched.value && errors.value && (
                  <p
                    id="deal-value-error"
                    className="mt-2 text-sm text-red-600"
                  >
                    {errors.value}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contact
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) =>
                    setFormData({ ...formData, contactId: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Stage
                </label>
                <select
                  value={formData.stageId}
                  onChange={(e) =>
                    setFormData({ ...formData, stageId: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No stage</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filters & sorting</h2>
            <p className="text-sm text-slate-500">
              Focus on the deals that matter and apply multi-field sorting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={logic}
              onChange={(e) => {
                setLogic(e.target.value as FilterLogic);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value="and">Match all</option>
              <option value="or">Match any</option>
            </select>
            <button
              onClick={handleAddFilter}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              + Add filter
            </button>
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filters.map((filter, index) => {
            const isStatus = filter.field === "status";
            const isContact = filter.field === "contactId";
            const isStage = filter.field === "stageId";
            const isValue = filter.field === "value";
            const isDate = filter.field === "createdAt";

            return (
              <div
                key={`${filter.field}-${index}`}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_1.5fr_auto]"
              >
                <select
                  value={filter.field}
                  onChange={(e) => {
                    const next = [...filters];
                    next[index] = { ...filter, field: e.target.value, value: "" };
                    updateFilters(next);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  {filterFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) => {
                    const next = [...filters];
                    next[index] = {
                      ...filter,
                      operator: e.target.value as ListFilter["operator"],
                    };
                    updateFilters(next);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  {filterOperators.map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>
                {isStatus ? (
                  <select
                    value={filter.value as string}
                    onChange={(e) => {
                      const next = [...filters];
                      next[index] = { ...filter, value: e.target.value };
                      updateFilters(next);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Any status</option>
                    <option value="open">Open</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                ) : isContact ? (
                  <select
                    value={filter.value as string}
                    onChange={(e) => {
                      const next = [...filters];
                      next[index] = { ...filter, value: e.target.value };
                      updateFilters(next);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Any contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                ) : isStage ? (
                  <select
                    value={filter.value as string}
                    onChange={(e) => {
                      const next = [...filters];
                      next[index] = { ...filter, value: e.target.value };
                      updateFilters(next);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="">Any stage</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={isValue ? "number" : isDate ? "date" : "text"}
                    value={filter.value as string}
                    onChange={(e) => {
                      const next = [...filters];
                      next[index] = { ...filter, value: e.target.value };
                      updateFilters(next);
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    placeholder="Enter value"
                  />
                )}
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Sort order
          </h3>
          <div className="space-y-3">
            {sort.map((entry, index) => (
              <div
                key={`${entry.field}-${index}`}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_auto]"
              >
                <select
                  value={entry.field}
                  onChange={(e) => {
                    const next = [...sort];
                    next[index] = { ...entry, field: e.target.value };
                    updateSort(next);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  {sortFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={entry.direction}
                  onChange={(e) => {
                    const next = [...sort];
                    next[index] = {
                      ...entry,
                      direction: e.target.value as SortOption["direction"],
                    };
                    updateSort(next);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
                <button
                  onClick={() => updateSort(sort.filter((_, idx) => idx !== index))}
                  className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500"
                  disabled={sort.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() =>
              updateSort([...sort, { field: "createdAt", direction: "desc" }])
            }
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            + Add sort
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Saved filters
          </h3>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={savedFilterName}
              onChange={(e) => setSavedFilterName(e.target.value)}
              placeholder="Name this filter set"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button
              onClick={handleSaveFilter}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700"
            >
              Save current filters
            </button>
          </div>
          {savedFilters.length > 0 ? (
            <div className="space-y-2">
              {savedFilters.map((entry) => (
                <div
                  key={entry.name}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">{entry.name}</span>
                  <button
                    onClick={() => handleApplySavedFilter(entry.name)}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleDeleteSavedFilter(entry.name)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No saved filters yet.</p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Active filters
          </h3>
          {activeFilters.length > 0 || sort.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <span
                  key={`${filter.field}-${index}`}
                  className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium"
                >
                  {filter.field} {filter.operator} {String(filter.value)}
                </span>
              ))}
              {sort.map((entry, index) => (
                <span
                  key={`${entry.field}-${index}`}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium"
                >
                  {entry.field} {entry.direction}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No active filters.</p>
          )}
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-slate-100 rounded-xl"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color || "#6B7280" }}
                  />
                  <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                  <span className="ml-auto text-sm text-slate-500">
                    {getDealsByStage(stage.id).length}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  ${getStageTotal(stage.id).toLocaleString()}
                </p>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {getDealsByStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing border-2 transition-all ${
                      draggedDeal?.id === deal.id
                        ? "opacity-50 border-indigo-300"
                        : "border-transparent hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-slate-900">
                        {deal.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          deal.status === "won"
                            ? "bg-green-100 text-green-700"
                            : deal.status === "lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 mt-2">
                      ${deal.value.toLocaleString()}
                    </p>
                    {getContactName(deal.contactId) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {getContactName(deal.contactId)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openEditForm(deal)}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="text-red-600 hover:text-red-500 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => openCreateForm(stage.id)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-sm font-medium"
                >
                  + Add Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {deals.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No deals yet. Create your first deal!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <button
                      onClick={() => handleHeaderSort("title")}
                      className="inline-flex items-center gap-2 hover:text-slate-700"
                    >
                      Title
                      {sort.find((entry) => entry.field === "title") && (
                        <span>
                          {sort.find((entry) => entry.field === "title")
                            ?.direction === "asc"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <button
                      onClick={() => handleHeaderSort("value")}
                      className="inline-flex items-center gap-2 hover:text-slate-700"
                    >
                      Value
                      {sort.find((entry) => entry.field === "value") && (
                        <span>
                          {sort.find((entry) => entry.field === "value")
                            ?.direction === "asc"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    <button
                      onClick={() => handleHeaderSort("status")}
                      className="inline-flex items-center gap-2 hover:text-slate-700"
                    >
                      Status
                      {sort.find((entry) => entry.field === "status") && (
                        <span>
                          {sort.find((entry) => entry.field === "status")
                            ?.direction === "asc"
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {deal.title}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      ${deal.value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getContactName(deal.contactId) || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={deal.stageId || ""}
                        onChange={(e) =>
                          handleStageChange(deal.id, e.target.value)
                        }
                        className="px-2 py-1 rounded border border-slate-200 text-sm"
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          deal.status === "won"
                            ? "bg-green-100 text-green-700"
                            : deal.status === "lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditForm(deal)}
                        className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(deal.id)}
                        className="text-red-600 hover:text-red-500 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {deals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total)
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination.hasPreviousPage}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
