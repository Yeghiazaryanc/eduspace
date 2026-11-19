import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

// Հաստատուններ՝ Magic Number-ներից և ամեն render-ին ավելորդ Memory Allocation-ից խուսափելու համար
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Օգնող ֆունկցիա՝ Axios/API սխալից անվտանգ կերպով հաղորդագրությունը հանելու համար (առանց "any" տիպի)
const getErrorMessage = (error: unknown, fallback: string): string =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/**
 * Profile Page (User Account & Avatar Management)
 * Պատասխանատու է օգտատիրոջ պրոֆիլի դիտման, տեքստային տվյալների խմբագրման
 * և ավատարի ակնթարթային վերբեռնման (multipart/form-data) համար՝
 * գլոբալ Zustand Auth Store-ի հետ սինխրոնիզացիայով։
 */
export const Profile: React.FC = () => {
    // 1. GLOBAL STATE (Zustand Atomic Selectors)
    // Բաժանորդագրվում ենք միայն user-ին և setUser-ին, որպեսզի store-ի այլ դաշտերը չառաջացնեն re-render
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    // 2. AVATAR UPLOAD STATE & DOM REF
    const [isUploading, setIsUploading] = useState<boolean>(false);
    // useRef-ը թույլ է տալիս ծրագրային կերպով բացել թաքնված <input type="file">-ը՝ առանց re-render-ի
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 3. PROFILE EDIT FORM STATE (Controlled Inputs)
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Սինխրոնիզացնում ենք տեղային ֆորման գլոբալ user օբյեկտի փոփոխությունների հետ
    useEffect(() => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
    }, [user]);

    /**
     * 4. AVATAR UPLOAD HANDLER (Instant Multipart Upload)
     * Ընտրված նկարը վավերացնում է Client-ում (տիպ և չափ)՝ նախքան ավելորդ
     * Network Bandwidth վատնելը, ապա ուղարկում է FormData-ով։
     */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isUploading) return;

        // Client-side MIME Type Check (Defense-in-depth՝ Backend-ի Magic Bytes ստուգման հետ միասին)
        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            toast.error('Only JPEG, PNG, and WebP images are allowed.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // File Size Check (2MB սահմանափակում՝ մեծ բինար ֆայլերով սերվերը չծանրաբեռնելու համար)
        if (file.size > MAX_AVATAR_SIZE_BYTES) {
            toast.error('File size must be less than 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Բինար ֆայլեր ուղարկելու ստանդարտ բրաուզերային կոնտեյներ (multipart/form-data)
        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            setIsUploading(true);

            const response = await api.post('/api/users/avatar', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data?.user) {
                // Թարմացնում ենք գլոբալ Zustand Store-ը՝ միաժամանակ թարմացնելով և՛ Profile-ը, և՛ Navbar-ը
                setUser(response.data.user);
            }
            toast.success('Avatar updated successfully!');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to upload avatar.'));
        } finally {
            setIsUploading(false);
            // Մաքրում ենք input-ի արժեքը, որպեսզի սխալի կամ կրկնակի ընտրության դեպքում
            // նույն ֆայլն ընտրելիս onChange-ը կրկին աշխատի
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /**
     * 5. PROFILE TEXT UPDATE HANDLER
     * Կիրառում է Data Sanitization (trim), Dirty Check և Double Submit պաշտպանություն։
     */
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim();
        if (!trimmedName || !trimmedEmail) return;

        // Dirty Check. եթե ոչինչ իրականում չի փոխվել, ավելորդ PUT հարցում չենք ուղարկում բազա
        if (trimmedName === user.name && trimmedEmail === user.email) {
            setIsEditing(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.put('/api/users/profile', {
                name: trimmedName,
                email: trimmedEmail,
            });

            if (res.data?.user) {
                // Single Source of Truth. թարմացնում ենք գլոբալ store-ը սերվերի վերադարձրած օբյեկտով
                setUser(res.data.user);
            }
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Failed to update profile.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Վերականգնում է ֆորմայի արժեքները չեղարկելիս՝ Stale Form State-ից խուսափելու համար
    const handleCancelEdit = () => {
        if (user) {
            setFormData({ name: user.name, email: user.email });
        }
        setIsEditing(false);
    };

    if (!user) return null;

    // Անվտանգ fallback սկզբնատառի համար (պաշտպանում է դատարկ name-ից)
    const userInitial = (user.name?.trim().charAt(0) || '?').toUpperCase();

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                {/* Վերևի Բաններ և Ավատարի Բլոկ */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute -bottom-12 left-8 group">
                        {/* 3 վիճակների մշակում՝ Uploading Spinner -> User Avatar -> Initials Fallback */}
                        {isUploading ? (
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gray-800 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                            </div>
                        ) : user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 object-cover bg-white"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
                                {userInitial}
                            </div>
                        )}

                        {/* Սեմանտիկ <button> A11y-ի համար (ստեղնաշարով հասանելի Tab/Enter-ով) */}
                        {!isUploading && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Change Avatar"
                                title="Change Avatar"
                                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer transition-opacity outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Խմբագրման ռեժիմին անցնելու կոճակ */}
                    {!isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            Edit Info
                        </button>
                    )}
                </div>

                <div className="pt-16 p-8">
                    {/* Թաքնված File Input՝ կառավարվում է fileInputRef-ով */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={ALLOWED_AVATAR_TYPES.join(', ')}
                        aria-label="Upload profile avatar"
                        className="hidden"
                    />

                    {isEditing ? (
                        /* --- ԽՄԲԱԳՐՄԱՆ ՌԵԺԻՄ (Controlled Form) --- */
                        <form onSubmit={handleUpdate} className="space-y-5 max-w-md">
                            <div>
                                <label
                                    htmlFor="profile-name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    required
                                    disabled={isSubmitting}
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="profile-email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="profile-email"
                                    type="email"
                                    required
                                    disabled={isSubmitting}
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-60"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleCancelEdit}
                                    className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* --- ԴԻՏՄԱՆ ՌԵԺԻՄ (Read-Only View) --- */
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                {user.name}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">{user.email}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        Account Role
                                    </span>
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${
                                            user.role === 'admin'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}
                                    >
                                        {user.role}
                                    </span>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        Member Since
                                    </span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {/* Fallback՝ եթե JWT payload-ում created_at դաշտը ներառված չէ */}
                                        {user.created_at
                                            ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric',
                                              })
                                            : 'Active Member'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};