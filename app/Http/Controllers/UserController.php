<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Spatie\Permission\Models\Role; // Uncomment jika pakai Spatie Permissions

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles:id,name')
                     ->select('id', 'name', 'email', 'avatar', 'created_at')
                     ->latest()
                     ->paginate(10);
        return Inertia::render('Users/Index', ['users' => $users]);
    }

    public function create()
    {
        $roles = Role::orderBy('name')->get(['id', 'name']); // Uncomment jika pakai Spatie
        return Inertia::render('Users/Create', [
            'roles' => $roles // Uncomment jika pakai Spatie
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'roles' => 'nullable|array', // Uncomment jika pakai Spatie
            'roles.*' => 'exists:roles,id', // Uncomment jika pakai Spatie
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        if ($request->filled('roles')) { // Uncomment jika pakai Spatie
            $user->syncRoles($request->roles);
        }

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::orderBy('name')->get(['id', 'name']); // Uncomment jika pakai Spatie
        $user->load('roles:id'); // Eager load roles // Uncomment jika pakai Spatie

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles, // Uncomment jika pakai Spatie
            'userRoles' => $user->roles->pluck('id')->toArray() // Kirim ID roles yang dimiliki user // Uncomment jika pakai Spatie
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
        ];
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        if ($request->filled('roles')) { // Uncomment jika pakai Spatie
            $user->syncRoles($request->roles);
        } else {
            $user->syncRoles([]); // Hapus semua role jika tidak ada yang dipilih
        }

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        // Hindari menghapus diri sendiri atau admin utama
        if ($user->id === auth()->id() || $user->hasRole('super-admin')) {
            return redirect()->route('users.index')->with('error', 'Cannot delete self or super admin.');
        }
        $user->delete();
        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
} 