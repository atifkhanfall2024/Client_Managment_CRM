import { updateOwnProfileAction } from "@/actions/users";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormShell } from "@/components/forms/form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-500">Manage your profile and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile
            <Badge variant="secondary" className="capitalize">
              {profile.role.replace("_", " ")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormShell action={updateOwnProfileAction} submitLabel="Save profile">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={profile.phone ?? ""}
              />
            </div>
          </FormShell>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Use the sun/moon icon in the header to toggle light and dark mode. Your
          preference is saved in the browser.
        </CardContent>
      </Card>
    </div>
  );
}
