import { useEffect, useState } from 'react';
import {
  Plane,
  MessageCircle,
  Phone,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
  Users,
  MapPin,
  Smartphone,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { format } from 'date-fns';

interface TravelInquiry {
  id: string;
  reference_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  service_type: string;
  departure_city: string;
  destination: string;
  travel_date: string;
  return_date: string | null;
  passengers: number;
  notes: string | null;
  source: 'mobile_app' | 'website';
  status: 'pending' | 'contacted' | 'confirmed' | 'cancelled';
  created_at: string;
}

const STATUS_BADGE: Record<TravelInquiry['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdminTravelInquiries() {
  const [inquiries, setInquiries] = useState<TravelInquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { role } = useAdminAuth();

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('travel_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInquiries((data as TravelInquiry[]) || []);
    } catch (error: any) {
      console.error('Error loading travel inquiries:', error);
      toast({
        title: 'Error Loading Requests',
        description: error?.message || 'Could not fetch travel booking requests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: TravelInquiry['status']) {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('travel_inquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );

      toast({
        title: 'Status Updated',
        description: `Booking marked as ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error?.message || 'Could not update inquiry status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('travel_inquiries').delete().eq('id', id);
      if (error) throw error;

      setInquiries((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: 'Request Deleted',
        description: 'Travel request removed from list.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error?.message || 'Could not delete inquiry.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  const filtered =
    statusFilter === 'all'
      ? inquiries
      : inquiries.filter((item) => item.status === statusFilter);

  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Plane className="h-6 w-6 text-red-600" />
            Travel & Umrah Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bookings and inquiries submitted from the Mobile App and Website travel forms
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white px-3 py-1">
              {pendingCount} Pending
            </Badge>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white border-slate-300 text-slate-900">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchInquiries}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-4">
            <Plane className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-900">No travel requests yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              When customers submit the Umrah, Flight, or Visa form in the Mobile App or Website, their booking requests appear here immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-slate-700">Ref / Customer</TableHead>
                  <TableHead className="text-slate-700">Service & Trip</TableHead>
                  <TableHead className="text-slate-700">Schedule</TableHead>
                  <TableHead className="text-slate-700">Status</TableHead>
                  <TableHead className="text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const cleanDigits = item.phone.replace(/[^0-9]/g, '');
                  const replyText = `Hello ${item.full_name}! This is Aboki BDC Travels regarding your request ${item.reference_code} (${item.service_type}: ${item.departure_city} → ${item.destination}).`;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {item.reference_code}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.source === 'mobile_app' ? (
                                <>
                                  <Smartphone className="w-2.5 h-2.5" /> App
                                </>
                              ) : (
                                <>
                                  <Globe className="w-2.5 h-2.5" /> Web
                                </>
                              )}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {item.full_name}
                          </p>
                          <p className="text-xs text-slate-600">{item.phone}</p>
                          {item.email && (
                            <p className="text-xs text-slate-400">{item.email}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="space-y-1 max-w-xs">
                          <p className="font-medium text-slate-900 text-xs sm:text-sm">
                            {item.service_type}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {item.departure_city} → {item.destination}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {item.passengers} traveler{item.passengers !== 1 ? 's' : ''}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top text-xs text-slate-600 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 font-medium text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                            {item.travel_date}
                          </p>
                          {item.return_date && (
                            <p className="text-slate-500">Return: {item.return_date}</p>
                          )}
                          <p className="text-[11px] text-slate-400 pt-1">
                            Sent:{' '}
                            {item.created_at
                              ? format(new Date(item.created_at), 'MMM d, HH:mm')
                              : 'Recently'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onValueChange={(val) =>
                            handleStatusChange(item.id, val as TravelInquiry['status'])
                          }
                        >
                          <SelectTrigger
                            className={`w-32 h-8 text-xs font-semibold border ${STATUS_BADGE[item.status]}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${cleanDigits}?text=${encodeURIComponent(
                              replyText
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                            title="Reply on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          {role === 'super_admin' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id)}
                              className="text-slate-400 hover:text-red-600 px-2"
                              title="Delete request"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
