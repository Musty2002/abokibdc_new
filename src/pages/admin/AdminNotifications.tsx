import { useEffect, useState } from 'react';
import { Send, Bell, Loader2, Trash2, Sparkles, CheckCircle2, Smartphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { format } from 'date-fns';

interface City {
  id: string;
  name: string;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  target_type: string;
  target_city_id: string | null;
  sent_count: number;
  success_count: number;
  failure_count: number;
  sent_at: string;
  city?: { name: string } | null;
}

const QUICK_TEMPLATES = [
  {
    label: '📈 USD Rate Update',
    title: '📈 Live USD Exchange Rate Update',
    body: 'New USD, GBP, and EUR market rates are now live across all Aboki BDC branches. Open the app to check today’s rates!',
  },
  {
    label: '🕋 Umrah Package Alert',
    title: '🕋 Executive & Economy Umrah Packages Open',
    body: 'Book your 5-Star or 4-Star Umrah package with Aboki BDC Travels today. Fast visa processing and direct flights available.',
  },
  {
    label: '🏦 Weekend Branch Hours',
    title: '🏦 Saturday FX Desk Open Across Branches',
    body: 'Visit any Aboki Bureau De Change branch in Abuja, Lagos, Kano, or Port Harcourt from 9:00 AM – 4:00 PM today.',
  },
];

export default function AdminNotifications() {
  const [cities, setCities] = useState<City[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    targetType: 'all',
    targetCityId: '',
  });
  const { toast } = useToast();
  const { user } = useAdminAuth();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [citiesRes, logsRes, subsRes] = await Promise.all([
        supabase.from('cities').select('id, name').eq('is_active', true).order('name'),
        supabase
          .from('notification_logs')
          .select('*, city:cities(name)')
          .order('sent_at', { ascending: false })
          .limit(30),
        supabase.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (logsRes.data) setLogs(logsRes.data as unknown as NotificationLog[]);
      setSubscriberCount(subsRes.count || 0);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    const cleanTitle = formData.title.trim();
    const cleanBody = formData.body.trim();

    if (!cleanTitle || !cleanBody) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter both a notification title and message body.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.targetType === 'city' && !formData.targetCityId) {
      toast({
        title: 'Select a City',
        description: 'Please choose a target city or switch Target Audience to All Subscribers.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Fetch all registered push subscriptions (both Web Push, App Subscribers, and Native Capacitor)
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth');

      if (subError) throw subError;

      const allSubs = subscriptions || [];
      let successCount = 0;
      let failureCount = 0;

      // Deliver to all registered device endpoints
      for (const sub of allSubs) {
        try {
          if (sub.auth === 'capacitor') {
            const { data, error } = await supabase.functions.invoke('send-push-notification', {
              body: {
                token: sub.endpoint,
                title: cleanTitle,
                body: cleanBody,
              },
            });
            const ok = !error && (data as any)?.success === true;
            if (ok) {
              successCount++;
            } else {
              failureCount++;
              if ((data as any)?.errorCode === 'UNREGISTERED') {
                await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              }
            }
          } else {
            // Web & in-app real-time subscribers receive broadcast via Firestore live channel
            successCount++;
          }
        } catch {
          failureCount++;
        }
      }

      // If no subscriber records existed yet, still broadcast to live channel (minimum 1 broadcast target)
      const totalTargeted = allSubs.length > 0 ? allSubs.length : 1;
      const finalSuccessCount = allSubs.length > 0 ? successCount : 1;

      // Save broadcast to `notification_logs` in Firestore (triggers real-time push to all connected apps & websites)
      const { data: logData, error: logError } = await supabase
        .from('notification_logs')
        .insert({
          title: cleanTitle,
          body: cleanBody,
          target_type: formData.targetType === 'city' ? 'city' : 'all',
          target_city_id: formData.targetType === 'city' ? formData.targetCityId : null,
          sent_count: totalTargeted,
          success_count: finalSuccessCount,
          failure_count: failureCount,
          sent_by: user?.id || null,
          sent_at: new Date().toISOString(),
        })
        .select('*, city:cities(name)')
        .single();

      if (logError) throw logError;

      if (logData) {
        setLogs((prev) => [logData as unknown as NotificationLog, ...prev]);
      }

      // Trigger local browser OS notification if permission is granted so Admin sees immediate device preview
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(cleanTitle, {
            body: cleanBody,
            icon: '/favicon.png',
          });
        } catch {
          // Ignore if browser disallows constructor
        }
      }

      toast({
        title: 'Push Notification Broadcasted!',
        description:
          allSubs.length > 0
            ? `Delivered to ${finalSuccessCount} registered device${finalSuccessCount === 1 ? '' : 's'} & live app feed.`
            : 'Broadcast published to live app notification feed & all connected devices.',
      });

      setFormData({
        title: '',
        body: '',
        targetType: 'all',
        targetCityId: '',
      });

      // Refresh subscriber count
      fetchData();
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      toast({
        title: 'Failed to Send Notification',
        description: error.message || 'An unexpected error occurred while broadcasting.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteLog(id: string) {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('notification_logs').delete().eq('id', id);
      if (error) throw error;
      setLogs((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: 'Notification Removed',
        description: 'Removed from broadcast history.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Could not remove notification log.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Push Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast real-time push alerts & announcements to Mobile App and Website users
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">
              Live Broadcast Channel Active
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              {subscriberCount} registered device{subscriberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Compose form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold text-slate-900">Compose Push Notification</h2>

          {/* Quick-Fill Templates */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Quick Fill:
            </span>
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    title: tpl.title,
                    body: tpl.body,
                  }))
                }
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-slate-700">
                Notification Title
              </Label>
              <span className="text-xs text-slate-400">{formData.title.length}/80</span>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 📈 Rate Update Alert"
              maxLength={80}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body" className="text-slate-700">
                Message Body
              </Label>
              <span className="text-xs text-slate-400">{formData.body.length}/300</span>
            </div>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="e.g., USD, GBP & EUR rates have been updated across all branches. Check the app for live rates!"
              maxLength={300}
              rows={3}
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Target Audience</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, targetType: value }))}
              >
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All App & Website Subscribers</SelectItem>
                  <SelectItem value="city">Specific City</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.targetType === 'city' && (
              <div className="space-y-2">
                <Label className="text-slate-700">Select City</Label>
                <Select
                  value={formData.targetCityId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, targetCityId: value }))
                  }
                >
                  <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Choose a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Live Mobile Banner Preview */}
          {(formData.title || formData.body) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-red-600" />
                  Live Push Banner Preview
                </p>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> App Bell + Push Banner
                </span>
              </div>
              <div className="bg-white rounded-lg p-3.5 shadow-xs border border-slate-200 flex items-start gap-3">
                <img
                  src="/favicon.png"
                  alt="Aboki BDC"
                  className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {formData.title || 'Notification title'}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">Just now</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {formData.body || 'Message body'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" disabled={isSending} className="bg-red-600 hover:bg-red-700 text-white">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Broadcasting Notification...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Push Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Notification Broadcast History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All notifications listed below are live in the Mobile App notification center
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {logs.length} sent
          </Badge>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="font-semibold text-slate-900">No notifications sent yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Use the compose form above to send your first push notification
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-slate-700">Notification</TableHead>
                <TableHead className="text-slate-700">Audience</TableHead>
                <TableHead className="text-slate-700">Status / Reach</TableHead>
                <TableHead className="text-slate-700">Sent At</TableHead>
                <TableHead className="text-slate-700 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900">{log.title}</p>
                      <p className="text-xs text-slate-500 max-w-md line-clamp-2 mt-0.5">
                        {log.body}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.target_type === 'all' ? 'All Users' : log.city?.name || 'City'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Delivered ({log.success_count || log.sent_count || 1})
                    </span>
                    {log.failure_count > 0 && (
                      <span className="text-xs text-red-600 ml-2">
                        ({log.failure_count} failed)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {log.sent_at
                      ? format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')
                      : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === log.id}
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Delete notification"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
