'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Profile = {
  id: string;
  org_id: string;
  full_name: string | null;
};

type Rating = 1 | -1;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<Rating | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  function resetForm() {
    setRating(null);
    setMessage('');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === null) {
      setError('Please choose 👍 or 👎 first.');
      return;
    }

    setSubmitting(true);

    try {
      // Get user + org_id (if signed in)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let orgId: string | null = null;
      let userId: string | null = null;

      if (user) {
        userId = user.id;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, org_id, full_name')
          .eq('id', user.id)
          .maybeSingle<Profile>();

        if (!profileError && profile) {
          orgId = profile.org_id;
        }
      }

      const { error: insertError } = await supabase.from('feedback').insert([
        {
          org_id: orgId,
          user_id: userId,
          rating, // +1 or -1
          message: message.trim() || null,
        },
      ]);

      if (insertError) {
        console.error('Feedback insert error:', insertError);
        throw new Error(insertError.message ?? 'Failed to submit feedback.');
      }

      // Success: close modal + show toast
      setOpen(false);
      resetForm();
      setShowToast(true);

      setTimeout(() => setShowToast(false), 2500);
    } catch (err: any) {
      console.error('Feedback submit exception:', err);
      setError(err?.message ?? 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating "Give feedback" button bottom-right */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 shadow-sm hover:bg-slate-800/90 backdrop-blur transition-colors"
      >
        <span>Give feedback</span>
        <span className="text-base" aria-hidden="true">
          💬
        </span>
      </button>

      {/* Glassy modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <Card className="w-full max-w-md rounded-2xl border-slate-800 bg-slate-900/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span>Help improve AssignIQ</span>
                <Badge variant="outline" className="text-[10px]">
                  Beta feedback
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                How&apos;s it feeling so far? A quick thumb and a few words go a long way.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating controls */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">
                    Overall, how is AssignIQ working for you right now?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRating(1)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm flex items-center justify-center gap-2 transition-all ${
                        rating === 1
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200 shadow-sm'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">
                        👍
                      </span>
                      <span>It&apos;s working well</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRating(-1)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm flex items-center justify-center gap-2 transition-all ${
                        rating === -1
                          ? 'border-red-400 bg-red-500/10 text-red-200 shadow-sm'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">
                        👎
                      </span>
                      <span>Something&apos;s off</span>
                    </button>
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Anything specific you&apos;d like to share? (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Bugs, ideas, confusing flows, or what you love so far."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5] resize-y"
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting}
                    className="bg-[#3578E5] hover:bg-[#2861bc]"
                  >
                    {submitting ? 'Sending…' : 'Send feedback'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simple toast */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full bg-slate-900/95 border border-slate-700 px-4 py-2 text-xs text-slate-100 shadow-md backdrop-blur">
            Thanks for helping improve AssignIQ.
          </div>
        </div>
      )}
    </>
  );
}
