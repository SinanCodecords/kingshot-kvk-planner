import { ArrowRight, Hammer } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <PageHeader
        eyebrow="Alliance tools"
        title="Kingshot Tools"
        description="Everything the alliance needs to plan KvK, in one place. Works best on your phone."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.slug} className="transition-shadow hover:ring-primary/40">
            <CardHeader className="gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <tool.icon className="size-5.5" />
              </span>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto flex flex-wrap gap-2 border-t pt-4">
              <Link href={tool.href} className={buttonVariants({ size: "lg" })}>
                Open <ArrowRight data-icon="inline-end" />
              </Link>
              {tool.links?.map((link) => (
                <Link key={link.href} href={link.href} className={buttonVariants({ variant: "ghost", size: "lg" })}>
                  {link.label}
                </Link>
              ))}
            </CardFooter>
          </Card>
        ))}
        <Card className="border-dashed bg-transparent ring-0 outline-1 outline-border outline-dashed">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
            <Hammer className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">More tools coming</p>
            <p className="text-xs text-muted-foreground">Ideas? Tell your R4.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
