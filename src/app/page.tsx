import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kingshot Tools</h1>
        <p className="text-sm text-muted-foreground">Tools for our alliance.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.slug}>
            <CardHeader>
              <tool.icon className="mb-2 size-6 text-muted-foreground" />
              <CardTitle>{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2">
              <Link href={tool.href} className={buttonVariants()}>
                Open
              </Link>
              {tool.links?.map((link) => (
                <Link key={link.href} href={link.href} className={buttonVariants({ variant: "outline" })}>
                  {link.label}
                </Link>
              ))}
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
