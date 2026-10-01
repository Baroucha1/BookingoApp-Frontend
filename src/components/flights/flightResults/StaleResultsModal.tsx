// src/components/flights/flightResults/StaleResultsModal.jsx
export function StaleResultsModal({ open, onNewSearch, onRefreshResults }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
                <p className="text-3xl mb-2">⚠️</p>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Veuillez actualiser votre recherche pour voir les derniers prix.
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                    Les prix des vols changent fréquemment en raison de la disponibilité et de la demande.
                    Nous voulons nous assurer que vous voyez toujours les prix les plus à jour.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={onNewSearch}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Nouvelle recherche
                    </button>
                    <button
                        type="button"
                        onClick={onRefreshResults}
                        className="px-4 py-2 rounded-xl bg-[#F5A623] text-white text-sm font-semibold hover:opacity-90"
                    >
                        Nouveaux résultats
                    </button>
                </div>
            </div>
        </div>
    );
}