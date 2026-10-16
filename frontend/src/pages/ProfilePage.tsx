import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      <div className="card">
        <p className="text-sm text-slate-500">Name</p>
        <p className="font-medium mb-3">{user.name}</p>
        <p className="text-sm text-slate-500">Email</p>
        <p className="font-medium mb-3">{user.email}</p>
        <p className="text-sm text-slate-500">Role</p>
        <p className="font-medium mb-3">{user.role}</p>
        <p className="text-sm text-slate-500">Green Points</p>
        <p className="font-medium">{user.greenPoints}</p>
      </div>
    </div>
  );
}
