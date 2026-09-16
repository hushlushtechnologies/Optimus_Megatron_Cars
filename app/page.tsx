import { Mail, Search, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Divider } from "@/src/components/ui/divider";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Spinner } from "@/src/components/ui/spinner";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-h1">Phase 3 — Component Check</h1>

      <Card variant="flat" className="flex flex-wrap items-center gap-4">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button isLoading>Loading</Button>
        <IconButton aria-label="Send email">
          <Mail className="size-4" />
        </IconButton>
        <IconButton aria-label="Delete" variant="outline">
          <Trash2 className="size-4" />
        </IconButton>
      </Card>

      <Card className="flex flex-col gap-4">
        <Input
          label="Email address"
          placeholder="admin@optimusmegatron.ae"
          leftIcon={<Mail className="size-4" />}
        />
        <Input
          label="Search"
          placeholder="Search inventory..."
          leftIcon={<Search className="size-4" />}
        />
        <Input
          label="With error"
          defaultValue="bad-value"
          error="This field is required"
        />
        <Textarea
          label="Internal note"
          placeholder="Add a note about this customer..."
        />
      </Card>

      <Divider label="STATUS BADGES" />

      <Card className="flex flex-wrap gap-2">
        <Badge status="success">Active</Badge>
        <Badge status="warning">Pending</Badge>
        <Badge status="danger">Cancelled</Badge>
        <Badge status="info">In Review</Badge>
        <Badge>Draft</Badge>
      </Card>

      <Divider />

      <Card className="flex items-center gap-6">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </Card>

      <Card className="flex flex-col gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </Card>
    </main>
  );
}
