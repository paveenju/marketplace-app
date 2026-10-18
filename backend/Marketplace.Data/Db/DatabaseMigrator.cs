using System.Reflection;
using DbUp;

namespace Marketplace.Data.Db;

// Applies the SQL scripts under Db/Scripts to the database.
//
// Scripts are embedded in the assembly (see the csproj) and run in filename
// order. DbUp records each one in a "schemaversions" table, so already-applied
// scripts are skipped on subsequent starts.
public static class DatabaseMigrator
{
    public static void Run(string connectionString)
    {
        // Creates the database if it doesn't exist yet. A no-op when Postgres
        // was started with POSTGRES_DB already set, as in docker-compose.
        EnsureDatabase.For.PostgresqlDatabase(connectionString);

        var upgrader = DeployChanges.To
            .PostgresqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(
                Assembly.GetExecutingAssembly(),
                name => name.Contains(".Db.Scripts.", StringComparison.Ordinal))
            .WithTransactionPerScript() // DbUp runs without a transaction unless asked
            .LogToConsole()
            .Build();

        var result = upgrader.PerformUpgrade();

        // Fail loudly: serving traffic against a half-applied schema is worse
        // than not starting at all.
        if (!result.Successful)
        {
            throw new InvalidOperationException(
                $"Database migration failed on script '{result.ErrorScript?.Name ?? "unknown"}'.",
                result.Error);
        }
    }
}
