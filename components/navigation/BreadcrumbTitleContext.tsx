"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface BreadcrumbTitleContextValue {
  title: string | null;
  setTitle: (title: string | null) => void;
}

const BreadcrumbTitleContext = createContext<BreadcrumbTitleContextValue>({
  title: null,
  setTitle: () => {},
});

export function BreadcrumbTitleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <BreadcrumbTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </BreadcrumbTitleContext.Provider>
  );
}

export function useBreadcrumbTitle() {
  return useContext(BreadcrumbTitleContext);
}

/** Drop this inside any client page to override the last breadcrumb segment. */
export function SetBreadcrumbTitle({ title }: { title: string }) {
  const { setTitle } = useBreadcrumbTitle();
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
  return null;
}
