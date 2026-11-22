import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plane, RefreshCw, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type InquiryStatus = "new" | "in_progress" | "completed" | "cancelled";

interface TravelInquiry {
  id: string;
  created_at: string;
  inquiry_type: string;
  subject: string;
  details: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: InquiryStatus;
  admin_notes: string | null;
}

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminTravelInquiries() {
  const [inquiries, setInquiries] = useState<TravelInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | InquiryStatus>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<TravelInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<InquiryStatus>("new");
  const [isSaving, setIsSaving] = useState(false);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("travel_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInquiries((data as TravelInquiry[]) ?? []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load inquiries", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const openDetail = (inquiry: TravelInquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotes(inquiry.admin_notes ?? "");
    setNewStatus(inquiry.status);
  };

  const handleSave = async () => {
    if (!selectedInquiry) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("travel_inquiries")
        .update({ status: newStatus, admin_notes: adminNotes || null })
        .eq("id", selectedInquiry.id);
      if (error) throw error;
      toast({ title: "Inquiry updated successfully" });
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (err) {
      console.error(err);
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" />
            Travel Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Booking requests submitted from the Travels section
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchInquiries} className="h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Count pill */}
      {!isLoading && (
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-800">{inquiries.length}</span> inquiry(ies)
        </p>
      )}

      {/* Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Plane className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No travel inquiries yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Inquiry</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{inq.full_name}</p>
                      <p className="text-xs text-slate-500">{inq.phone}</p>
                      {inq.email && (
                        <p className="text-xs text-slate-400">{inq.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{inq.subject}</p>
                      {inq.details && (
                        <p className="text-xs text-slate-400 truncate">{inq.details}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {inq.inquiry_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[inq.status]}`}
                      >
                        {STATUS_LABELS[inq.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(inq.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(inq)}
                        className="h-8 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedInquiry?.subject}</DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 text-sm">
              {/* Customer details */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name</span>
                  <span className="font-semibold">{selectedInquiry.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <a href={`tel:${selectedInquiry.phone}`} className="font-semibold text-primary hover:underline">
                    {selectedInquiry.phone}
                  </a>
                </div>
                {selectedInquiry.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-semibold text-primary hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted</span>
                  <span>{formatDate(selectedInquiry.created_at)}</span>
                </div>
              </div>

              {/* Inquiry info */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inquiry Details</p>
                {selectedInquiry.details && (
                  <p className="text-slate-700">{selectedInquiry.details}</p>
                )}
                {selectedInquiry.notes && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900">
                    <span className="font-semibold">Customer notes: </span>{selectedInquiry.notes}
                  </div>
                )}
              </div>

              {/* Admin controls */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Update Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(v) => setNewStatus(v as InquiryStatus)}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Admin Notes (internal)</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this inquiry..."
                    className="mt-1 text-xs min-h-[72px] resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 h-9 text-xs font-semibold"
                  >
                    {isSaving ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInquiry(null)}
                    className="h-9 text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
