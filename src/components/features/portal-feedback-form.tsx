"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitPortalFeedbackAction } from "@/actions/feedback";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending..." : "Submit"}
    </Button>
  );
}

export function PortalFeedbackForm() {
  const [state, formAction] = useActionState(
    submitPortalFeedbackAction,
    null as ActionResult | null
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base">Share feedback or a feature idea</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          Admin aur manager ko yeh message mil jayega — improvements aur
          suggestions yahan likhein.
        </p>
        <form action={formAction} className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select id="type" name="type" required defaultValue="feedback">
              <option value="feedback">General feedback</option>
              <option value="feature">Feature suggestion</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={3}
              placeholder="Short summary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Details *</Label>
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={5}
              placeholder="What worked well, what to improve, or which feature you want..."
            />
          </div>
          {state && !state.success && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="rounded-lg bg-brand-soft/40 px-3 py-2 text-sm">
              Thanks — your note was sent to the team.
            </p>
          )}
          <div>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
