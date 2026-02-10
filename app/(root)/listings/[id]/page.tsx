import ListingGallery from "@/components/listing/ListingGallery";
import ListingInfo from "@/components/listing/ListingInfo";
import ListingSidebar from "@/components/listing/ListingSidebar";
import { fetchListingById } from "@/lib/actions/listings.action";
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

export default async function ListingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const result = await fetchListingById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const listing = result.data;

  // Check if user is authenticated (staff)
  const session = await auth();
  const isStaff = !!session?.user;

  return (
    <main>
      <div className="bg-black">
        <Navbar />
      </div>

      <section className="container mx-auto p-4 lg:p-10 pt-32">
        {/* Breadcrumbs */}
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
                <Link href={ROUTES.LISTINGS}>Annonces</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {listing.title || listing.referenceCode}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Gallery */}
        <ListingGallery images={listing.images} isStaff={isStaff} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* Main content */}
          <ListingInfo listing={listing} isStaff={isStaff} />

          {/* Sidebar */}
          <ListingSidebar listing={listing} />
        </div>
      </section>
    </main>
  );
}
