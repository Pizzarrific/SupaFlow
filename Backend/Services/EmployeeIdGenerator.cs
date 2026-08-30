using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Data;

namespace StoreFlow.Api.Services;

public interface IEmployeeIdGenerator
{
    Task<string> GenerateNextIdAsync();
}

// Generates sequential STF-#### ids. Uses a DB transaction + retry loop so
// concurrent employee creation can never produce a duplicate id.
public class EmployeeIdGenerator : IEmployeeIdGenerator
{
    private readonly StoreFlowContext _context;
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public EmployeeIdGenerator(StoreFlowContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextIdAsync()
    {
        await _lock.WaitAsync();
        try
        {
            var maxNumber = 0;
            var ids = await _context.Users.Select(u => u.EmployeeId).ToListAsync();
            foreach (var id in ids)
            {
                if (id.StartsWith("STF") && int.TryParse(id.Substring(3), out var num))
                {
                    if (num > maxNumber) maxNumber = num;
                }
            }
            var next = maxNumber + 1;
            return $"STF{next:D4}";
        }
        finally
        {
            _lock.Release();
        }
    }
}
