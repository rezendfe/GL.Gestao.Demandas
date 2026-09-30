IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'app')
    EXEC(N'CREATE SCHEMA app');
GO
