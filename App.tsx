
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, remove, push, set } from 'firebase/database';
import Swal from 'sweetalert2';

// --- FIREBASE CONFIG (Matching the User's provided values) ---
const firebaseConfig = {
  apiKey: "AIzaSyAgzEFdpuSzkyYVFtO1tPOty91eKU3xdJ4",
  authDomain: "micto-eff50.firebaseapp.com",
  databaseURL: "https://micto-eff50-default-rtdb.firebaseio.com",
  projectId: "micto-eff50",
  storageBucket: "micto-eff50.firebasestorage.app",
  messagingSenderId: "160171998937",
  appId: "1:160171998937:web:c38e0dd8f17705d17d08c8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Types
type Page = 'dashboard' | 'users' | 'withdraws' | 'submissions' | 'deposits' | 'settings' | 'micro-tasks' | 'gift-codes';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingWd: 0,
    pendingSub: 0,
    pendingDep: 0
  });

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'admin123') { // Simple password for this demo
      setIsLoggedIn(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      Swal.fire('Error', 'Invalid Admin Password', 'error');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Listeners for Stats
    const usersRef = ref(db, 'users');
    const wdRef = ref(db, 'withdraws');
    const subRef = ref(db, 'submissions');
    const depRef = ref(db, 'deposits');

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.values(data);
      setStats(prev => ({
        ...prev,
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.active).length
      }));
    });

    onValue(wdRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.values(data);
      setStats(prev => ({ ...prev, pendingWd: items.filter((i: any) => i.status === 'pending').length }));
    });

    onValue(subRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.values(data);
      setStats(prev => ({ ...prev, pendingSub: items.filter((i: any) => i.status === 'pending').length }));
    });

    onValue(depRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.values(data);
      setStats(prev => ({ ...prev, pendingDep: items.filter((i: any) => i.status === 'pending').length }));
    });

  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">MicroCashBD Admin</h1>
            <p className="text-slate-500 text-sm">Enter password to access dashboard</p>
          </div>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Admin Password"
              className="w-full bg-slate-100 border-none rounded-2xl p-4 text-center text-lg outline-none focus:ring-2 ring-indigo-500 mb-6"
            />
            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition">
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-400 p-6 flex flex-col fixed h-full z-50">
        <h2 className="text-white text-xl font-bold mb-10 px-2 flex items-center gap-2">
          <i className="fas fa-shield-alt text-indigo-400"></i> MCBD ADMIN
        </h2>
        
        <nav className="flex-1 space-y-2">
          <NavItem active={currentPage === 'dashboard'} icon="fa-th-large" label="Dashboard" onClick={() => setCurrentPage('dashboard')} />
          <NavItem active={currentPage === 'users'} icon="fa-users" label="Users" onClick={() => setCurrentPage('users')} />
          <NavItem active={currentPage === 'withdraws'} icon="fa-wallet" label="Withdrawals" onClick={() => setCurrentPage('withdraws')} count={stats.pendingWd} />
          <NavItem active={currentPage === 'submissions'} icon="fa-tasks" label="Submissions" onClick={() => setCurrentPage('submissions')} count={stats.pendingSub} />
          <NavItem active={currentPage === 'deposits'} icon="fa-university" label="Deposits/Acts" onClick={() => setCurrentPage('deposits')} count={stats.pendingDep} />
          <div className="pt-4 mt-4 border-t border-slate-800">
            <NavItem active={currentPage === 'settings'} icon="fa-cog" label="System Settings" onClick={() => setCurrentPage('settings')} />
            <NavItem active={currentPage === 'micro-tasks'} icon="fa-mouse-pointer" label="Micro Tasks" onClick={() => setCurrentPage('micro-tasks')} />
            <NavItem active={currentPage === 'gift-codes'} icon="fa-gift" label="Gift Codes" onClick={() => setCurrentPage('gift-codes')} />
          </div>
        </nav>

        <button 
          onClick={() => { localStorage.removeItem('admin_auth'); setIsLoggedIn(false); }}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition font-medium"
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {currentPage === 'dashboard' && <DashboardView stats={stats} setPage={setCurrentPage} />}
        {currentPage === 'users' && <UsersView />}
        {currentPage === 'withdraws' && <WithdrawsView />}
        {currentPage === 'submissions' && <SubmissionsView />}
        {currentPage === 'deposits' && <DepositsView />}
        {currentPage === 'settings' && <SettingsView />}
        {currentPage === 'micro-tasks' && <MicroTasksView />}
        {currentPage === 'gift-codes' && <GiftCodesView />}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const NavItem: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void, count?: number }> = ({ active, icon, label, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition font-medium ${active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
  >
    <div className="flex items-center gap-3">
      <i className={`fas ${icon} w-5`}></i>
      {label}
    </div>
    {count && count > 0 ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{count}</span> : null}
  </button>
);

const Card: React.FC<{ title: string, value: string | number, icon: string, color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-xl`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

// --- VIEWS ---

const DashboardView: React.FC<{ stats: any, setPage: (p: Page) => void }> = ({ stats, setPage }) => (
  <div className="animate-fade-in">
    <h1 className="text-2xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <Card title="Total Users" value={stats.totalUsers} icon="fa-users" color="bg-blue-50 text-blue-600" />
      <Card title="Active Members" value={stats.activeUsers} icon="fa-check-circle" color="bg-green-50 text-green-600" />
      <Card title="Pending Withdrawals" value={stats.pendingWd} icon="fa-wallet" color="bg-orange-50 text-orange-600" />
      <Card title="Job Submissions" value={stats.pendingSub} icon="fa-tasks" color="bg-purple-50 text-purple-600" />
    </div>

    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setPage('deposits')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition">
          <i className="fas fa-university text-xl text-indigo-500"></i>
          <span className="text-sm font-bold">Approve Deposits</span>
        </button>
        <button onClick={() => setPage('withdraws')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition">
          <i className="fas fa-money-bill-wave text-xl text-orange-500"></i>
          <span className="text-sm font-bold">Manage Payouts</span>
        </button>
        <button onClick={() => setPage('gift-codes')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition">
          <i className="fas fa-gift text-xl text-pink-500"></i>
          <span className="text-sm font-bold">Create Gift Codes</span>
        </button>
        <button onClick={() => setPage('settings')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition">
          <i className="fas fa-bullhorn text-xl text-blue-500"></i>
          <span className="text-sm font-bold">Update Notice</span>
        </button>
      </div>
    </div>
  </div>
);

const UsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    onValue(ref(db, 'users'), (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]: any) => ({ ...val, id }));
      setUsers(list.reverse());
    });
  }, []);

  const toggleStatus = (id: string, current: boolean) => {
    update(ref(db, `users/${id}`), { active: !current });
    Swal.fire('Updated', 'User status changed', 'success');
  };

  const adjustBalance = async (id: string, current: number, field: string) => {
    const { value: amount } = await Swal.fire({
      title: 'Adjust Balance',
      input: 'number',
      inputLabel: `Current: ৳${current}`,
      inputPlaceholder: 'Enter new total balance',
      showCancelButton: true
    });
    if (amount) {
      update(ref(db, `users/${id}`), { [field]: parseFloat(amount) });
      Swal.fire('Success', 'Balance updated', 'success');
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.includes(search) || 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Users Management</h1>
        <input 
          type="text" 
          placeholder="Search ID or Name..."
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm w-64 outline-none focus:ring-2 ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs font-bold text-slate-500 uppercase">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Balance (Main)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase">{user.name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => adjustBalance(user.id, user.balance || 0, 'balance')}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    ৳{(user.balance || 0).toFixed(2)}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {user.active ? 'Verified' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleStatus(user.id, user.active)}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                  >
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WithdrawsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    onValue(ref(db, 'withdraws'), (snap) => {
      const data = snap.val() || {};
      setItems(Object.entries(data).map(([id, val]: any) => ({ ...val, id })).reverse());
    });
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected', item: any) => {
    if (status === 'rejected') {
      const { value: confirm } = await Swal.fire({
        title: 'Reject?',
        text: 'Balance will be refunded to user.',
        icon: 'warning',
        showCancelButton: true
      });
      if (!confirm) return;
      
      // Refund balance
      const field = item.source === 'main' ? 'balance' : (item.source === 'ref' ? 'refBalance' : (item.source === 'salary' ? 'salaryBalance' : 'bonusBalance'));
      onValue(ref(db, `users/${item.userId}/${field}`), (snap) => {
        const current = snap.val() || 0;
        update(ref(db, `users/${item.userId}`), { [field]: current + item.totalDeducted });
      }, { onlyOnce: true });
    }

    update(ref(db, `withdraws/${id}`), { status });
    Swal.fire('Updated', `Request ${status}`, 'success');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Withdrawal Requests</h1>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs font-bold text-slate-500 uppercase">
              <th className="px-6 py-4">User & Wallet</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{item.wallet}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{item.method} • ID: {item.userId}</p>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">৳{item.reqAmount}</td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500 capitalize">{item.source}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.status === 'pending' ? 'bg-orange-100 text-orange-600' : (item.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(item.id, 'approved', item)} className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"><i className="fas fa-check"></i></button>
                      <button onClick={() => handleAction(item.id, 'rejected', item)} className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"><i className="fas fa-times"></i></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SubmissionsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    onValue(ref(db, 'submissions'), (snap) => {
      const data = snap.val() || {};
      setItems(Object.entries(data).map(([id, val]: any) => ({ ...val, id })).reverse());
    });
  }, []);

  const approveJob = (id: string, item: any) => {
    // Get rate from item or system
    const rate = item.rate || 5; 
    
    // 1. Credit User
    onValue(ref(db, `users/${item.userId}/balance`), (snap) => {
        const current = snap.val() || 0;
        update(ref(db, `users/${item.userId}`), { balance: current + rate });
        // Log history
        const hId = push(ref(db, `history/${item.userId}`)).key;
        set(ref(db, `history/${item.userId}/${hId}`), {
            type: 'job_approved',
            amount: rate,
            title: `Job Approved: ${item.type}`,
            time: Date.now()
        });
    }, { onlyOnce: true });

    // 2. Referral Commission (If enabled)
    if(item.referrerId) {
        onValue(ref(db, `settings/jobRefBonus`), (snap) => {
            const bonus = snap.val() || 0;
            if(bonus > 0) {
                onValue(ref(db, `users/${item.referrerId}/refBalance`), (refSnap) => {
                    const currentRef = refSnap.val() || 0;
                    update(ref(db, `users/${item.referrerId}`), { refBalance: currentRef + bonus });
                    // Log ref history
                    const hIdRef = push(ref(db, `history/${item.referrerId}`)).key;
                    set(ref(db, `history/${item.referrerId}/${hIdRef}`), {
                        type: 'job_commission',
                        amount: bonus,
                        title: `Commission from ${item.userName}`,
                        time: Date.now()
                    });
                }, { onlyOnce: true });
            }
        }, { onlyOnce: true });
    }

    update(ref(db, `submissions/${id}`), { status: 'approved' });
    Swal.fire('Approved', `User credited ৳${rate}`, 'success');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Job Submissions</h1>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs font-bold text-slate-500 uppercase">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Job Details</th>
              <th className="px-6 py-4">Submitted Data</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{item.userName}</p>
                  <p className="text-[10px] text-slate-400">ID: {item.userId}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${item.type === 'gmail' ? 'border-red-200 text-red-600' : (item.type === 'facebook' ? 'border-blue-200 text-blue-600' : 'border-purple-200 text-purple-600')}`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                  <p className="text-xs text-slate-600 truncate">{item.email || item.uid || item.taskTitle}</p>
                  {item.pass && <p className="text-[10px] text-slate-400">Pass: {item.pass}</p>}
                  {item.proof && <p className="text-[10px] text-slate-400">Proof: {item.proof}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.status === 'pending' ? 'bg-orange-100 text-orange-600' : (item.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approveJob(item.id, item)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition">Approve</button>
                      <button onClick={() => update(ref(db, `submissions/${item.id}`), { status: 'rejected' })} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DepositsView: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
  
    useEffect(() => {
      onValue(ref(db, 'deposits'), (snap) => {
        const data = snap.val() || {};
        setItems(Object.entries(data).map(([id, val]: any) => ({ ...val, id })).reverse());
      });
    }, []);
  
    const approveAct = async (id: string, item: any) => {
      // 1. Mark Deposit Approved
      update(ref(db, `deposits/${id}`), { status: 'approved' });
      // 2. Set User Active
      update(ref(db, `users/${item.userId}`), { active: true });
      Swal.fire('Success', 'User Account Activated', 'success');
    };
  
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-8">Activation Requests</h1>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold text-slate-500 uppercase">
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Sender & Trx</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.userId}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{item.sender}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.trx}</p>
                  </td>
                  <td className="px-6 py-4 capitalize font-medium text-slate-500">{item.method}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'pending' && (
                      <button onClick={() => approveAct(item.id, item)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
};

const SettingsView: React.FC = () => {
    const [sets, setSets] = useState<any>({});
    
    useEffect(() => {
        onValue(ref(db, 'settings'), (snap) => {
            setSets(snap.val() || {});
        });
    }, []);

    const saveSettings = () => {
        update(ref(db, 'settings'), sets);
        Swal.fire('Saved', 'Settings updated successfully', 'success');
    };

    const handleInput = (key: string, val: any) => {
        setSets((p: any) => ({ ...p, [key]: val }));
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">System Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-5 border-b pb-3">Payment Numbers</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">bKash Personal</label>
                            <input type="text" value={sets.bkash || ''} onChange={e => handleInput('bkash', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 outline-none focus:ring-2 ring-pink-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nagad Personal</label>
                            <input type="text" value={sets.nagad || ''} onChange={e => handleInput('nagad', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 outline-none focus:ring-2 ring-orange-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-5 border-b pb-3">Rates & Fees</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Act. Fee (৳)</label>
                                <input type="number" value={sets.actFee || 0} onChange={e => handleInput('actFee', parseFloat(e.target.value))} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Act. Bonus (৳)</label>
                                <input type="number" value={sets.actBonus || 0} onChange={e => handleInput('actBonus', parseFloat(e.target.value))} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Ref Activation Bonus (৳)</label>
                            <input type="number" value={sets.refBonus || 0} onChange={e => handleInput('refBonus', parseFloat(e.target.value))} className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 outline-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <h3 className="font-bold text-slate-700 mb-5 border-b pb-3">Scrolling Notice</h3>
                <textarea 
                    rows={3}
                    value={sets.notice || ''}
                    onChange={e => handleInput('notice', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-500"
                    placeholder="Enter scrolling message for users..."
                ></textarea>
            </div>

            <button onClick={saveSettings} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-300 hover:scale-105 transition">SAVE ALL SETTINGS</button>
        </div>
    );
};

const MicroTasksView: React.FC = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTask, setNewTask] = useState({ title: '', rate: 0, link: '', type: 'telegram', instruction: '' });

    useEffect(() => {
        onValue(ref(db, 'settings/microTasks'), (snap) => {
            setTasks(snap.val() || []);
        });
    }, []);

    const addTask = () => {
        if(!newTask.title || !newTask.link) return Swal.fire('Error', 'Fill details', 'error');
        const updated = [...tasks, newTask];
        update(ref(db, 'settings'), { microTasks: updated });
        setNewTask({ title: '', rate: 0, link: '', type: 'telegram', instruction: '' });
        Swal.fire('Added', 'Task published', 'success');
    };

    const deleteTask = (idx: number) => {
        const updated = tasks.filter((_, i) => i !== idx);
        update(ref(db, 'settings'), { microTasks: updated });
    };

    return (
        <div className="max-w-5xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">Manage Micro Tasks</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-700 mb-5">Create New Task</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none" />
                        <input type="number" placeholder="Rate (৳)" value={newTask.rate} onChange={e => setNewTask({...newTask, rate: parseFloat(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none" />
                        <input type="text" placeholder="Link" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none" />
                        <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none">
                            <option value="telegram">Telegram</option>
                            <option value="facebook">Facebook</option>
                            <option value="website">Website</option>
                        </select>
                        <textarea placeholder="Instructions..." value={newTask.instruction} onChange={e => setNewTask({...newTask, instruction: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none"></textarea>
                        <button onClick={addTask} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Add Task</button>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {tasks.map((t, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-slate-800">{t.title}</h4>
                                <p className="text-xs text-indigo-600 font-bold">৳{t.rate}</p>
                            </div>
                            <button onClick={() => deleteTask(i)} className="text-red-500 p-3 hover:bg-red-50 rounded-xl transition"><i className="fas fa-trash"></i></button>
                        </div>
                    ))}
                    {tasks.length === 0 && <p className="text-center py-10 text-slate-400">No micro tasks found.</p>}
                </div>
            </div>
        </div>
    );
};

const GiftCodesView: React.FC = () => {
    const [codes, setCodes] = useState<any[]>([]);
    const [newCode, setNewCode] = useState({ code: '', amount: 0, limit: 1 });

    useEffect(() => {
        onValue(ref(db, 'giftCodes'), (snap) => {
            const data = snap.val() || {};
            setCodes(Object.entries(data).map(([id, val]: any) => ({ ...val, id })));
        });
    }, []);

    const createCode = () => {
        if(!newCode.code || newCode.amount <= 0) return Swal.fire('Error', 'Fill details', 'error');
        const codeUpper = newCode.code.toUpperCase();
        set(ref(db, `giftCodes/${codeUpper}`), {
            amount: newCode.amount,
            limit: newCode.limit,
            used: 0,
            time: Date.now()
        });
        setNewCode({ code: '', amount: 0, limit: 1 });
        Swal.fire('Created', `Code ${codeUpper} is now live!`, 'success');
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">Gift Code Manager</h1>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="text-xs font-bold text-slate-400 block mb-1">CODE NAME</label>
                        <input type="text" value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value})} placeholder="FREE50" className="w-full bg-slate-50 border-none rounded-xl p-3 uppercase outline-none focus:ring-2 ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">AMOUNT (৳)</label>
                        <input type="number" value={newCode.amount} onChange={e => setNewCode({...newCode, amount: parseFloat(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 block mb-1">LIMIT (USAGE)</label>
                        <input type="number" value={newCode.limit} onChange={e => setNewCode({...newCode, limit: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 outline-none" />
                    </div>
                    <button onClick={createCode} className="bg-slate-900 text-white h-[48px] rounded-xl font-bold hover:bg-black transition">Create Code</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs font-bold text-slate-500 uppercase">
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Reward</th>
                            <th className="px-6 py-4">Usage</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {codes.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 font-bold text-indigo-600">{c.id}</td>
                                <td className="px-6 py-4 font-bold">৳{c.amount}</td>
                                <td className="px-6 py-4">
                                    <p className="text-xs text-slate-700">{c.used || 0} / {c.limit}</p>
                                    <div className="w-24 h-1 bg-slate-100 rounded-full mt-1"><div className="h-full bg-indigo-500 rounded-full" style={{width: `${Math.min(((c.used||0)/c.limit)*100, 100)}%`}}></div></div>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => remove(ref(db, `giftCodes/${c.id}`))} className="text-red-500 hover:text-red-700 transition"><i className="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default App;
