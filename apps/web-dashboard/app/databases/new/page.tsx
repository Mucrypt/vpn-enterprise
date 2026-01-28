import { CreateDatabaseProjectWizard } from './create-database-project-wizard'

export default function CreateDatabaseProjectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const raw = searchParams?.returnTo
  const returnTo =
    typeof raw === 'string' && raw.startsWith('/') ? raw : '/databases'

  return <CreateDatabaseProjectWizard returnTo={returnTo} />
}
