import { useEffect, useState } from 'react';
import { Mail, Phone, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface ContactMessage {
    id: string;
    subject: string | null;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const API = import.meta.env.VITE_API_URL;

const ContactMessagesAdmin = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // ⚠️ adapte selon comment tu stockes le token ailleurs
            const res = await fetch(`${API}/api/admin/contact-messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const markAsRead = async (id: string) => {
        const token = localStorage.getItem('token');
        await fetch(`${API}/api/admin/contact-messages/${id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        });
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    };

    const deleteMessage = async (id: string) => {
        if (!confirm('Supprimer ce message ?')) return;
        const token = localStorage.getItem('token');
        await fetch(`${API}/api/admin/contact-messages/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[#0B1E5C] mb-6">Messages de contact</h1>

            <div className="flex flex-col gap-3">
                {messages.length === 0 && (
                    <p className="text-gray-500">Aucun message pour le moment.</p>
                )}
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`bg-white rounded-xl border p-5 ${m.isRead ? 'border-gray-100' : 'border-blue-300 bg-blue-50/30'}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-[#0B1E5C]">{m.name}</h3>
                                    {!m.isRead && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Nouveau</span>}
                                </div>
                                {m.subject && <p className="text-sm font-semibold text-gray-600 mt-1">{m.subject}</p>}
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{m.email}</span>
                                    {m.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{m.phone}</span>}
                                </div>
                                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{m.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(m.createdAt).toLocaleString('fr-FR')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => markAsRead(m.id)}
                                    title={m.isRead ? 'Lu' : 'Marquer comme lu'}
                                    className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                    {m.isRead ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-gray-400" />}
                                </button>
                                <button
                                    onClick={() => deleteMessage(m.id)}
                                    title="Supprimer"
                                    className="p-2 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContactMessagesAdmin;