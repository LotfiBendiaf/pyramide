import ListingGallery from "@/components/listing/ListingGallery";
import ResidenceInfo from "@/components/residence/ResidenceInfo";
import ResidenceSidebar from "@/components/residence/ResidenceSidebar";
import { fetchResidenceBySlug } from "@/lib/actions/residence.action";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/navigation/Navbar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import Link from "next/link";
import ROUTES from "@/constants/routes";

export default async function ResidenceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchResidenceBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const residence = result.data;

  const session = await auth();
  const isStaff = !!session?.user;

  if (!residence.isPublished && !isStaff) {
    notFound();
  }

  return (
    <main>
      <div className="bg-black">
        <Navbar variant="solid" />
      </div>

      <section className="container mx-auto p-4 lg:p-10">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.HOME} className="flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Accueil
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={ROUTES.RESIDENCES}>Résidences</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{residence.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ListingGallery images={residence.images} isStaff={isStaff} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <ResidenceInfo residence={residence} />
          <ResidenceSidebar residence={residence} />
        </div>
      </section>
    </main>
  );
}
