// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import AdminUserCreationForm from '../components/admin/AdminUserCreationForm';
// import BulkUserImport from '../components/admin/BulkUserImport';
// import UserActivityMonitor from '../components/admin/UserActivityMonitor';
// import { useAuth } from '../hooks/useAuth';
// import { User } from '../types';

// const Users: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // State management
//   const [users, setUsers] = useState<User[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filters, setFilters] = useState({
//     role: 'all',
//     department: 'all',
//     status: 'all'
//   });

//   // Modal states
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [showBulkImport, setShowBulkImport] = useState(false);
//   const [showActivityMonitor, setShowActivityMonitor] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [viewingUser, setViewingUser] = useState<User | null>(null);
//   const [showPasswordChange, setShowPasswordChange] = useState<User | null>(null);

//   // Initialize mock users data
//   useEffect(() => {
//     const mockUsers: User[] = [
//       {
//         id: '1',
//         email: 'admin@opticonnect.com',
//         name: 'Admin User',
//         role: 'admin',
//         permissions: ['all'],
//         assignedStates: [],
//         isActive: true,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         phoneNumber: '+91-9876543210',
//         department: 'IT Support',
//         employeeId: 'EMP001',
//         gender: 'male',
//         address: {
//           street: '123 Admin Street',
//           city: 'New Delhi',
//           state: 'Delhi',
//           pinCode: '110001'
//         },
//         supervisorName: 'CEO',
//         officeLocation: 'Delhi Head Office'
//       },
//       {
//         id: '2',
//         email: 'manager@opticonnect.com',
//         name: 'Regional Manager',
//         role: 'manager',
//         permissions: ['view', 'edit'],
//         assignedStates: ['Maharashtra', 'Gujarat'],
//         isActive: true,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         phoneNumber: '+91-9876543211',
//         department: 'Operations',
//         employeeId: 'EMP002',
//         gender: 'female',
//         address: {
//           street: '456 Manager Ave',
//           city: 'Mumbai',
//           state: 'Maharashtra',
//           pinCode: '400001'
//         },
//         supervisorName: 'Admin User',
//         officeLocation: 'Mumbai Branch'
//       },
//       {
//         id: '3',
//         email: 'tech@opticonnect.com',
//         name: 'Field Technician',
//         role: 'technician',
//         permissions: ['view'],
//         assignedStates: ['Maharashtra'],
//         isActive: true,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         phoneNumber: '+91-9876543212',
//         department: 'Engineering',
//         employeeId: 'EMP003',
//         gender: 'male',
//         address: {
//           street: '789 Tech Park',
//           city: 'Pune',
//           state: 'Maharashtra',
//           pinCode: '411001'
//         },
//         supervisorName: 'Regional Manager',
//         officeLocation: 'Pune Development Center'
//       },
//       {
//         id: '4',
//         email: 'user@opticonnect.com',
//         name: 'Regular User',
//         role: 'viewer',
//         permissions: ['view'],
//         assignedStates: ['Maharashtra', 'Gujarat', 'Rajasthan'],
//         isActive: false,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         phoneNumber: '+91-9876543213',
//         department: 'Customer Support',
//         employeeId: 'EMP004',
//         gender: 'female',
//         address: {
//           street: '321 Support Lane',
//           city: 'Jaipur',
//           state: 'Rajasthan',
//           pinCode: '302001'
//         },
//         supervisorName: 'Regional Manager',
//         officeLocation: 'Jaipur Office'
//       }
//     ];
//     setUsers(mockUsers);
//   }, []);

//   // Only allow admin users to access user management
//   if (!user || user.role !== 'admin') {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//           </svg>
//           <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Access Denied</h3>
//           <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//             You need admin privileges to access user management.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Filter users based on search and filters
//   const filteredUsers = users.filter(userItem => {
//     const matchesSearch = userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          userItem.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesRole = filters.role === 'all' || userItem.role === filters.role;
//     const matchesDepartment = filters.department === 'all' || userItem.department === filters.department;
//     const matchesStatus = filters.status === 'all' ||
//                          (filters.status === 'active' && userItem.isActive) ||
//                          (filters.status === 'inactive' && !userItem.isActive);

//     return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
//   });

//   // Statistics
//   const stats = {
//     total: users.length,
//     active: users.filter(u => u.isActive).length,
//     inactive: users.filter(u => !u.isActive).length,
//     roles: Array.from(new Set(users.map(u => u.role))).length
//   };

//   // CRUD operations
//   const handleCreateUser = () => {
//     setEditingUser(null);
//     setShowCreateForm(true);
//   };

//   const handleEditUser = (user: User) => {
//     setEditingUser(user);
//     setShowCreateForm(true);
//   };

//   const handleDeleteUser = (userId: string) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       setUsers(prev => prev.filter(u => u.id !== userId));
//     }
//   };

//   const handleToggleUserStatus = (userId: string) => {
//     setUsers(prev => prev.map(u =>
//       u.id === userId ? { ...u, isActive: !u.isActive } : u
//     ));
//   };

//   const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
//     if (!selectedUsers.length) return;

//     if (action === 'delete') {
//       if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
//         setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
//         setSelectedUsers([]);
//       }
//     } else {
//       const newStatus = action === 'activate';
//       setUsers(prev => prev.map(u =>
//         selectedUsers.includes(u.id) ? { ...u, isActive: newStatus } : u
//       ));
//       setSelectedUsers([]);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Header */}
//       <div className="bg-white dark:bg-gray-800 shadow">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center">
//               <button
//                 onClick={() => navigate('/dashboard')}
//                 className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
//               >
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//               </button>
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                   </svg>
//                 </div>
//                 <div className="ml-4">
//                   <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, roles, and permissions</p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={() => setShowActivityMonitor(true)}
//                 className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                 </svg>
//                 <span>Activity Monitor</span>
//               </button>
//               <button
//                 onClick={() => setShowBulkImport(true)}
//                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                 </svg>
//                 <span>Bulk Import</span>
//               </button>
//               <button
//                 onClick={handleCreateUser}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                 </svg>
//                 <span>Create User</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//           <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
//                   </svg>
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Users</dt>
//                     <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.total}</dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Users</dt>
//                     <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.active}</dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Inactive Users</dt>
//                     <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.inactive}</dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//                   </svg>
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Role Types</dt>
//                     <dd className="text-lg font-medium text-gray-900 dark:text-white">{stats.roles}</dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search and Filters */}
//         <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
//           <div className="flex flex-col sm:flex-row gap-4">
//             <div className="flex-1">
//               <input
//                 type="text"
//                 placeholder="Search users by name, email, or employee ID..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//               />
//             </div>
//             <div className="flex gap-2">
//               <select
//                 value={filters.role}
//                 onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
//                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//               >
//                 <option value="all">All Roles</option>
//                 <option value="admin">Admin</option>
//                 <option value="manager">Manager</option>
//                 <option value="technician">Technician</option>
//                 <option value="viewer">Viewer</option>
//               </select>
//               <select
//                 value={filters.department}
//                 onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
//                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//               >
//                 <option value="all">All Departments</option>
//                 <option value="IT Support">IT Support</option>
//                 <option value="Operations">Operations</option>
//                 <option value="Engineering">Engineering</option>
//                 <option value="Customer Support">Customer Support</option>
//               </select>
//               <select
//                 value={filters.status}
//                 onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
//                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//               >
//                 <option value="all">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Bulk Actions */}
//         {selectedUsers.length > 0 && (
//           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm text-blue-700 dark:text-blue-300">
//                   {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
//                 </span>
//               </div>
//               <div className="flex space-x-2">
//                 <button
//                   onClick={() => handleBulkAction('activate')}
//                   className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
//                 >
//                   Activate
//                 </button>
//                 <button
//                   onClick={() => handleBulkAction('deactivate')}
//                   className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
//                 >
//                   Deactivate
//                 </button>
//                 <button
//                   onClick={() => handleBulkAction('delete')}
//                   className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Users Table */}
//         <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//               <thead className="bg-gray-50 dark:bg-gray-900">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     <input
//                       type="checkbox"
//                       checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setSelectedUsers(filteredUsers.map(u => u.id));
//                         } else {
//                           setSelectedUsers([]);
//                         }
//                       }}
//                       className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
//                     />
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     User
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Role
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Department
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Assigned States
//                   </th>
//                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredUsers.map((user) => (
//                   <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <input
//                         type="checkbox"
//                         checked={selectedUsers.includes(user.id)}
//                         onChange={(e) => {
//                           if (e.target.checked) {
//                             setSelectedUsers(prev => [...prev, user.id]);
//                           } else {
//                             setSelectedUsers(prev => prev.filter(id => id !== user.id));
//                           }
//                         }}
//                         className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
//                       />
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="flex-shrink-0 h-10 w-10">
//                           <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
//                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                               {user.name.charAt(0).toUpperCase()}
//                             </span>
//                           </div>
//                         </div>
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
//                           <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
//                           {user.employeeId && (
//                             <div className="text-xs text-gray-400 dark:text-gray-500">ID: {user.employeeId}</div>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                         user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
//                         user.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
//                         user.role === 'technician' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
//                         'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
//                       }`}>
//                         {user.role}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
//                       {user.department || '-'}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
//                         <span className={`text-sm ${user.isActive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
//                           {user.isActive ? 'Active' : 'Inactive'}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
//                       {user.assignedStates?.length ? (
//                         <div className="max-w-xs">
//                           {user.assignedStates.length <= 2 ? (
//                             user.assignedStates.join(', ')
//                           ) : (
//                             `${user.assignedStates.slice(0, 2).join(', ')} +${user.assignedStates.length - 2} more`
//                           )}
//                         </div>
//                       ) : 'All States'}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                       <div className="flex items-center justify-end space-x-2">
//                         <button
//                           onClick={() => setViewingUser(user)}
//                           className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
//                           title="View Details"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => handleEditUser(user)}
//                           className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded"
//                           title="Edit User"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => setShowPasswordChange(user)}
//                           className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
//                           title="Change Password"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
//                           </svg>
//                         </button>
//                         <button
//                           onClick={() => handleToggleUserStatus(user.id)}
//                           className={`p-1 rounded ${user.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
//                           title={user.isActive ? 'Deactivate User' : 'Activate User'}
//                         >
//                           {user.isActive ? (
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
//                             </svg>
//                           ) : (
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                           )}
//                         </button>
//                         <button
//                           onClick={() => handleDeleteUser(user.id)}
//                           className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
//                           title="Delete User"
//                         >
//                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                           </svg>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {filteredUsers.length === 0 && (
//             <div className="text-center py-12">
//               <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//               </svg>
//               <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No users found</h3>
//               <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//                 Try adjusting your search or filter criteria.
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modals */}
//       {showCreateForm && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <AdminUserCreationForm
//               isOpen={true}
//               onClose={() => {
//                 setShowCreateForm(false);
//                 setEditingUser(null);
//               }}
//               onUserCreated={(newUser: any) => {
//                 if (editingUser) {
//                   setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...newUser, id: editingUser.id } : u));
//                 } else {
//                   setUsers(prev => [...prev, { ...newUser, id: `user-${Date.now()}` }]);
//                 }
//                 setShowCreateForm(false);
//                 setEditingUser(null);
//               }}
//             />
//           </div>
//         </div>
//       )}

//       {showBulkImport && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <BulkUserImport isOpen={true} onClose={() => setShowBulkImport(false)} />
//           </div>
//         </div>
//       )}

//       {showActivityMonitor && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
//             <UserActivityMonitor isOpen={true} onClose={() => setShowActivityMonitor(false)} />
//           </div>
//         </div>
//       )}

//       {viewingUser && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Details</h3>
//                 <button
//                   onClick={() => setViewingUser(null)}
//                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//                 >
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//             <div className="p-6 space-y-6">
//               <div className="flex items-center space-x-4">
//                 <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
//                   <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
//                     {viewingUser.name.charAt(0).toUpperCase()}
//                   </span>
//                 </div>
//                 <div>
//                   <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingUser.name}</h4>
//                   <p className="text-gray-600 dark:text-gray-400">{viewingUser.email}</p>
//                   {viewingUser.employeeId && (
//                     <p className="text-sm text-gray-500 dark:text-gray-500">Employee ID: {viewingUser.employeeId}</p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Basic Information</h5>
//                   <div className="space-y-2 text-sm">
//                     <div><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className="ml-2 text-gray-900 dark:text-white capitalize">{viewingUser.role}</span></div>
//                     <div><span className="text-gray-500 dark:text-gray-400">Department:</span> <span className="ml-2 text-gray-900 dark:text-white">{viewingUser.department || 'Not specified'}</span></div>
//                     <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="ml-2 text-gray-900 dark:text-white">{viewingUser.phoneNumber || 'Not specified'}</span></div>
//                     <div><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className={`ml-2 ${viewingUser.isActive ? 'text-green-600' : 'text-red-600'}`}>{viewingUser.isActive ? 'Active' : 'Inactive'}</span></div>
//                   </div>
//                 </div>

//                 {viewingUser.address && (
//                   <div>
//                     <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Address</h5>
//                     <div className="text-sm text-gray-900 dark:text-white">
//                       <div>{viewingUser.address.street}</div>
//                       <div>{viewingUser.address.city}, {viewingUser.address.state}</div>
//                       <div>PIN: {viewingUser.address.pinCode}</div>
//                     </div>
//                   </div>
//                 )}

//                 <div>
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Work Information</h5>
//                   <div className="space-y-2 text-sm">
//                     {viewingUser.supervisorName && (
//                       <div><span className="text-gray-500 dark:text-gray-400">Supervisor:</span> <span className="ml-2 text-gray-900 dark:text-white">{viewingUser.supervisorName}</span></div>
//                     )}
//                     {viewingUser.officeLocation && (
//                       <div><span className="text-gray-500 dark:text-gray-400">Office:</span> <span className="ml-2 text-gray-900 dark:text-white">{viewingUser.officeLocation}</span></div>
//                     )}
//                   </div>
//                 </div>

//                 <div>
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Assigned States</h5>
//                   <div className="text-sm text-gray-900 dark:text-white">
//                     {viewingUser.assignedStates?.length ? (
//                       <div className="flex flex-wrap gap-1">
//                         {viewingUser.assignedStates.map(state => (
//                           <span key={state} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded">
//                             {state}
//                           </span>
//                         ))}
//                       </div>
//                     ) : (
//                       <span className="text-gray-500 dark:text-gray-400">All States</span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="col-span-full">
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Permissions</h5>
//                   <div className="flex flex-wrap gap-1">
//                     {viewingUser.permissions?.map(permission => (
//                       <span key={permission} className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded capitalize">
//                         {permission.replace('_', ' ')}
//                       </span>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Account Created</h5>
//                   <p className="text-sm text-gray-900 dark:text-white">
//                     {new Date(viewingUser.createdAt).toLocaleDateString()}
//                   </p>
//                 </div>

//                 <div>
//                   <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Last Updated</h5>
//                   <p className="text-sm text-gray-900 dark:text-white">
//                     {new Date(viewingUser.updatedAt).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showPasswordChange && (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
//             <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
//                 <button
//                   onClick={() => setShowPasswordChange(null)}
//                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//                 >
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//             <div className="p-6">
//               <div className="mb-4">
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                   Change password for: <span className="font-semibold text-gray-900 dark:text-white">{showPasswordChange.name}</span>
//                 </p>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                       New Password
//                     </label>
//                     <input
//                       type="password"
//                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                       placeholder="Enter new password"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                       Confirm Password
//                     </label>
//                     <input
//                       type="password"
//                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                       placeholder="Confirm new password"
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div className="flex justify-end space-x-3">
//                 <button
//                   onClick={() => setShowPasswordChange(null)}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     // Handle password change logic here
//                     alert('Password change functionality would be implemented here');
//                     setShowPasswordChange(null);
//                   }}
//                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
//                 >
//                   Change Password
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Users;

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminUserCreationForm from "../components/admin/AdminUserCreationForm";
import BulkUserImport from "../components/admin/BulkUserImport";
import UserActivityMonitor from "../components/admin/UserActivityMonitor";
import UserGroupManagement from "../components/admin/UserGroupManagement";
import { useAuth } from "../hooks/useAuth";
import { useUserManagement } from "../hooks/useUserManagement";
import { User } from "../types";
import NavigationBar from "../components/common/NavigationBar";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const Users: React.FC = () => {
  const { user } = useAuth();
  const userManagement = useUserManagement();

  // State management
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    department: "all",
    status: "all"
  });

  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showActivityMonitor, setShowActivityMonitor] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState<User | null>(
    null
  );
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Load users and user groups from user management system
  useEffect(() => {
    userManagement.loadUsers();
    userManagement.loadUserGroups();
  }, [userManagement.loadUsers, userManagement.loadUserGroups]);

  // Only allow admin users to access user management
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You need admin privileges to access user management.
          </p>
        </div>
      </div>
    );
  }

  // Filter users based on search and filters
  const filteredUsers = userManagement.users.filter((userItem) => {
    const matchesSearch =
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filters.role === "all" || userItem.role === filters.role;
    const matchesDepartment =
      filters.department === "all" ||
      userItem.department === filters.department;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && userItem.isActive) ||
      (filters.status === "inactive" && !userItem.isActive);

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  // Statistics
  const stats = {
    total: userManagement.users.length,
    active: userManagement.users.filter((u) => u.isActive).length,
    inactive: userManagement.users.filter((u) => !u.isActive).length,
    roles: Array.from(new Set(userManagement.users.map((u) => u.role))).length
  };

  // CRUD operations
  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowCreateForm(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = userManagement.users.find((u: User) => u.id === userId);
    if (user) {
      setUserToDelete(user);
    }
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      userManagement.deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const user = userManagement.users.find((u: User) => u.id === userId);
    if (user) {
      userManagement.updateUser(userId, { isActive: !user.isActive });
    }
  };

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    if (!selectedUsers.length) return;

    if (action === "delete") {
      if (
        window.confirm(
          `Are you sure you want to delete ${selectedUsers.length} users?`
        )
      ) {
        selectedUsers.forEach(userId => {
          userManagement.deleteUser(userId);
        });
        setSelectedUsers([]);
      }
    } else {
      const newStatus = action === "activate";
      selectedUsers.forEach(userId => {
        userManagement.updateUser(userId, { isActive: newStatus });
      });
      setSelectedUsers([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors mr-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Users Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    Manage users, roles, and permissions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowActivityMonitor(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Activity Monitor</span>
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Bulk Import</span>
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Create User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("users")}
              className={`${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              <span>Users</span>
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {userManagement.users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`${
                activeTab === "groups"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>User Groups</span>
              <span className="bg-gray-100 text-gray-900 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {userManagement.userGroups.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <>
          {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.active}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactive Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.inactive}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Role Types
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.roles}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, role: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="technician">Technician</option>
                <option value="viewer">Viewer</option>
              </select>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    department: e.target.value
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Departments</option>
                <option value="IT Support">IT Support</option>
                <option value="Operations">Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Customer Support">Customer Support</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-700">
                  {selectedUsers.length} user
                  {selectedUsers.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction("activate")}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction("deactivate")}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned States
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50 transition-colors duration-200 border-l-4 border-transparent hover:border-blue-400">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers((prev) => [...prev, user.id]);
                          } else {
                            setSelectedUsers((prev) =>
                              prev.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            user.isActive
                              ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            <span className="text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-semibold ${
                            user.isActive ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {user.name}
                          </div>
                          <div className={`text-sm ${
                            user.isActive ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {user.email}
                          </div>
                          <div className={`text-sm font-medium ${
                            user.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            @{user.username}
                          </div>
                          {user.employeeId && (
                            <div className={`text-xs font-medium ${
                              user.isActive ? 'text-purple-600' : 'text-gray-400'
                            }`}>
                              ID: {user.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border-2 ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : user.role === "manager"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : user.role === "technician"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {user.role === "admin" && "👑 "}
                        {user.role === "manager" && "⚡ "}
                        {user.role === "technician" && "🔧 "}
                        {user.role === "viewer" && "👁️ "}
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        user.department ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {user.department || "No Department"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 border-2 ${
                            user.isActive
                              ? "bg-green-400 border-green-500 shadow-lg"
                              : "bg-red-400 border-red-500 shadow-lg"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-semibold ${
                            user.isActive ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {user.isActive ? "✅ Active" : "❌ Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.assignedStates?.length ? (
                          <div className="max-w-xs">
                            <span className="text-indigo-600">
                              {user.assignedStates.length <= 2
                                ? user.assignedStates.join(", ")
                                : `${user.assignedStates.slice(0, 2).join(", ")} +${
                                    user.assignedStates.length - 2
                                  } more`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-green-600 font-semibold">🌍 All States</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Edit User"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowPasswordChange(user)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Change Password"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`p-1 rounded ${
                            user.isActive
                              ? "text-yellow-600 hover:text-yellow-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                          title={
                            user.isActive ? "Deactivate User" : "Activate User"
                          }
                        >
                          {user.isActive ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete User"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <AdminUserCreationForm
              isOpen={true}
              onClose={() => {
                setShowCreateForm(false);
                setEditingUser(null);
              }}
              onUserCreated={(newUser: any) => {
                if (editingUser) {
                  userManagement.updateUser(editingUser.id, newUser);
                } else {
                  userManagement.createUser(newUser);
                }
                setShowCreateForm(false);
                setEditingUser(null);
              }}
            />
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <BulkUserImport
              isOpen={true}
              onClose={() => setShowBulkImport(false)}
            />
          </div>
        </div>
      )}

      {showActivityMonitor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <UserActivityMonitor
              isOpen={true}
              onClose={() => setShowActivityMonitor(false)}
            />
          </div>
        </div>
      )}

      {viewingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details
                </h3>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-700">
                    {viewingUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {viewingUser.name}
                  </h4>
                  <p className="text-gray-600">{viewingUser.email}</p>
                  {viewingUser.employeeId && (
                    <p className="text-sm text-gray-500">
                      Employee ID: {viewingUser.employeeId}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Basic Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>{" "}
                      <span className="ml-2 text-gray-900 capitalize">
                        {viewingUser.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>{" "}
                      <span className="ml-2 text-gray-900">
                        {viewingUser.department || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{" "}
                      <span className="ml-2 text-gray-900">
                        {viewingUser.phoneNumber || "Not specified"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span
                        className={`ml-2 ${
                          viewingUser.isActive
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {viewingUser.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingUser.address && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Address
                    </h5>
                    <div className="text-sm text-gray-900">
                      <div>{viewingUser.address.street}</div>
                      <div>
                        {viewingUser.address.city}, {viewingUser.address.state}
                      </div>
                      <div>PIN: {viewingUser.address.pinCode}</div>
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Work Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    {viewingUser.supervisorName && (
                      <div>
                        <span className="text-gray-500">Supervisor:</span>{" "}
                        <span className="ml-2 text-gray-900">
                          {viewingUser.supervisorName}
                        </span>
                      </div>
                    )}
                    {viewingUser.officeLocation && (
                      <div>
                        <span className="text-gray-500">Office:</span>{" "}
                        <span className="ml-2 text-gray-900">
                          {viewingUser.officeLocation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Assigned States
                  </h5>
                  <div className="text-sm text-gray-900">
                    {viewingUser.assignedStates?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {viewingUser.assignedStates.map((state) => (
                          <span
                            key={state}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {state}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">All States</span>
                    )}
                  </div>
                </div>

                <div className="col-span-full">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Permissions
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {viewingUser.permissions?.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded capitalize"
                      >
                        {permission.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Account Created
                  </h5>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Last Updated
                  </h5>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingUser.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordChange(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Change password for:{" "}
                  <span className="font-semibold text-gray-900">
                    {showPasswordChange.name}
                  </span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasswordChange(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle password change logic here
                    alert(
                      "Password change functionality would be implemented here"
                    );
                    setShowPasswordChange(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* Header with gradient */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">
                    Delete User Confirmation
                  </h3>
                </div>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="text-red-200 hover:text-white transition-colors rounded-full p-1 hover:bg-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* User Info Card */}
              <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {userToDelete.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {userToDelete.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {userToDelete.email}
                    </p>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        userToDelete.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        userToDelete.role === 'manager' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        userToDelete.role === 'technician' ? 'bg-green-100 text-green-800 border-green-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}
                      </span>
                      {userToDelete.department && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border">
                          {userToDelete.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h5 className="text-sm font-medium text-red-800 mb-1">
                      This action cannot be undone
                    </h5>
                    <p className="text-sm text-red-700">
                      Are you sure you want to permanently delete <span className="font-semibold">{userToDelete.name}</span>?
                      This will remove all their data, permissions, and access to the system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete User</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* User Groups Tab Content */}
      {activeTab === "groups" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <UserGroupManagement
            isOpen={true}
            onClose={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default Users;
