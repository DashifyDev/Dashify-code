import LibraryHeader from "@/app/library/libraryHeader";

export default function SubscriptionLayout({ children }) {
  return (
    <>
      <LibraryHeader />
      {children}
    </>
  );
}
