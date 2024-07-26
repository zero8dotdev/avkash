export default async function Layout({
    children,
    modal,
  }: Readonly<{ children: React.ReactNode,modal: React.ReactNode }>) {
    return (
        <>
        {children}
        {modal}
        </>
    )
  }