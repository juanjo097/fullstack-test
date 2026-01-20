import { useEffect, useState } from "react";
import { z } from "zod";
import { contactService, type Contact, notify } from "../services";
import {
  getFormErrors,
  sanitizeFilters,
  type FilterLogic,
  type ListFilter,
  type SortOption,
} from "../utils";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^[+\d\s()-]{7,}$/.test(value), {
      message: "Enter a valid phone number",
    }),
});

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<ListFilter[]>([
    { field: "name", operator: "contains", value: "" },
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
    const stored = localStorage.getItem("contactsSavedFilters");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadContacts();
  }, [page, limit, filters, sort, logic]);

  async function loadContacts() {
    try {
      setLoading(true);
      const response = await contactService.getAll({
        page,
        limit,
        filters: sanitizeFilters(filters),
        sort,
        logic,
      });
      setContacts(response.data);
      setPagination(response.meta);
    } catch (error) {
      console.error("Failed to load contacts:", error);
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
    updateFilters([...filters, { field: "name", operator: "contains", value: "" }]);
  }

  function handleRemoveFilter(index: number) {
    const next = filters.filter((_, idx) => idx !== index);
    updateFilters(next.length ? next : [{ field: "name", operator: "contains", value: "" }]);
  }

  function handleSaveFilter() {
    const trimmed = savedFilterName.trim();
    if (!trimmed) return;

    const nextFilters = sanitizeFilters(filters);
    const payload = { name: trimmed, filters: nextFilters, sort, logic };
    const updated = [...savedFilters.filter((f) => f.name !== trimmed), payload];
    setSavedFilters(updated);
    localStorage.setItem("contactsSavedFilters", JSON.stringify(updated));
    setSavedFilterName("");
  }

  function handleApplySavedFilter(name: string) {
    const saved = savedFilters.find((entry) => entry.name === name);
    if (!saved) return;
    setFilters(saved.filters.length ? saved.filters : [{ field: "name", operator: "contains", value: "" }]);
    setSort(saved.sort.length ? saved.sort : [{ field: "createdAt", direction: "desc" }]);
    setLogic(saved.logic);
    setPage(1);
  }

  function handleDeleteSavedFilter(name: string) {
    const updated = savedFilters.filter((entry) => entry.name !== name);
    setSavedFilters(updated);
    localStorage.setItem("contactsSavedFilters", JSON.stringify(updated));
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
    setFilters([{ field: "name", operator: "contains", value: "" }]);
    setLogic("and");
    setSort([{ field: "createdAt", direction: "desc" }]);
    setPage(1);
  }

  function openCreateForm() {
    setFormData({ name: "", email: "", phone: "" });
    setErrors({});
    setTouched({ name: false, email: false, phone: false });
    setEditingContact(null);
    setShowForm(true);
  }

  function openEditForm(contact: Contact) {
    setFormData({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
    });
    setErrors({});
    setTouched({ name: false, email: false, phone: false });
    setEditingContact(contact);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const validationErrors = getFormErrors(contactSchema, formData);
    if (Object.keys(validationErrors).length > 0) {
      setTouched({ name: true, email: true, phone: true });
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    try {
      if (editingContact) {
        await contactService.update(editingContact.id, formData);
        notify.success("The contact was updated successfully");
      } else {
        await contactService.create(formData);
        notify.success("The contact was created successfully");
      }
      await loadContacts();
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save contact:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await contactService.delete(id);
      notify.success("The contact was deleted successfully");
      await loadContacts();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  }

  const filterFields = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
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
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
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
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 mt-1">Manage your contacts</p>
        </div>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
        >
          Add Contact
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingContact ? "Edit Contact" : "New Contact"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const nextFormData = { ...formData, name: e.target.value };
                  setFormData(nextFormData);
                  if (touched.name) {
                    setErrors(getFormErrors(contactSchema, nextFormData));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  setErrors(getFormErrors(contactSchema, formData));
                }}
                required
                aria-invalid={touched.name && !!errors.name}
                aria-describedby={
                  touched.name && errors.name ? "contact-name-error" : undefined
                }
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  touched.name && errors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-300"
                }`}
              />
              {touched.name && errors.name && (
                <p
                  id="contact-name-error"
                  className="mt-2 text-sm text-red-600"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  const nextFormData = { ...formData, email: e.target.value };
                  setFormData(nextFormData);
                  if (touched.email) {
                    setErrors(getFormErrors(contactSchema, nextFormData));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }));
                  setErrors(getFormErrors(contactSchema, formData));
                }}
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={
                  touched.email && errors.email
                    ? "contact-email-error"
                    : undefined
                }
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  touched.email && errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-300"
                }`}
              />
              {touched.email && errors.email && (
                <p
                  id="contact-email-error"
                  className="mt-2 text-sm text-red-600"
                >
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const nextFormData = { ...formData, phone: e.target.value };
                  setFormData(nextFormData);
                  if (touched.phone) {
                    setErrors(getFormErrors(contactSchema, nextFormData));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, phone: true }));
                  setErrors(getFormErrors(contactSchema, formData));
                }}
                aria-invalid={touched.phone && !!errors.phone}
                aria-describedby={
                  touched.phone && errors.phone
                    ? "contact-phone-error"
                    : undefined
                }
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  touched.phone && errors.phone
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-300"
                }`}
              />
              {touched.phone && errors.phone && (
                <p
                  id="contact-phone-error"
                  className="mt-2 text-sm text-red-600"
                >
                  {errors.phone}
                </p>
              )}
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
              Narrow down contacts and apply multi-field sorting.
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
          {filters.map((filter, index) => (
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
              <input
                type={filter.field === "createdAt" ? "date" : "text"}
                value={filter.value as string}
                onChange={(e) => {
                  const next = [...filters];
                  next[index] = { ...filter, value: e.target.value };
                  updateFilters(next);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                placeholder="Enter value"
              />
              <button
                onClick={() => handleRemoveFilter(index)}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          ))}
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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No contacts yet. Add your first contact!
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  <button
                    onClick={() => handleHeaderSort("name")}
                    className="inline-flex items-center gap-2 hover:text-slate-700"
                  >
                    Name
                    {sort.find((entry) => entry.field === "name") && (
                      <span>
                        {sort.find((entry) => entry.field === "name")
                          ?.direction === "asc"
                          ? "↑"
                          : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  <button
                    onClick={() => handleHeaderSort("email")}
                    className="inline-flex items-center gap-2 hover:text-slate-700"
                  >
                    Email
                    {sort.find((entry) => entry.field === "email") && (
                      <span>
                        {sort.find((entry) => entry.field === "email")
                          ?.direction === "asc"
                          ? "↑"
                          : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  <button
                    onClick={() => handleHeaderSort("phone")}
                    className="inline-flex items-center gap-2 hover:text-slate-700"
                  >
                    Phone
                    {sort.find((entry) => entry.field === "phone") && (
                      <span>
                        {sort.find((entry) => entry.field === "phone")
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
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-900 font-medium">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {contact.email || "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {contact.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditForm(contact)}
                      className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
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
        {contacts.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
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
    </div>
  );
}
