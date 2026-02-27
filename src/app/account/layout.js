import LibraryHeader from "@/app/library/libraryHeader";

export default function AccountLayout({ children }) {
  return (
    <>
      <LibraryHeader />
      {children}
    </>
  );
}
