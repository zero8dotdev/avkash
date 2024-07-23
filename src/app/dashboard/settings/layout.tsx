export default async function SettingsLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <>
      {modal}
      {children}
    </>
  );
}
