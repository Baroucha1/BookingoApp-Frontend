import { useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface Section {
    titleKey?: TranslationKey;
    bodyKey: TranslationKey;
    listKey?: TranslationKey;
    paragraphs: string[];
    list?: string[];
}

const sections: Section[] = [
    {
        bodyKey: 'privacyBody1',
        paragraphs: [
            "Le but de cette politique, ainsi que de nos Conditions d'utilisation, est d'expliquer comment nous collectons, utilisons et protegeons vos donnees personnelles a travers nos applications et nos sites web. Nous examinons et adaptons cette politique de temps en temps pour nous assurer qu'elle couvre les differentes lois sur la confidentialite dans le monde entier, et vous pouvez trouver la derniere version ici. Si des changements tres significatifs sont apportes a la politique, nous pouvons informer nos utilisateurs par le biais de notifications affichees sur nos applications ou d'autres formes de communication.",
            "Nous definissons les \"donnees personnelles\", de maniere generale, comme toute information vous concernant en tant qu'individu identifiable. Votre nom, votre adresse e-mail, vos coordonnees de contact, votre adresse IP ou vos identifiants de peripherique sont des exemples qui repondent a cette definition. Nous pouvons egalement stocker d'autres informations moins specifiques sur la maniere dont vous utilisez notre service, ou sur le pays a partir duquel vous utilisez nos systemes. Comme nous travaillons souvent avec des fournisseurs qui recoivent egalement vos informations personnelles (par exemple, des sites de voyage, des agents, des compagnies aeriennes, etc.) dans le cadre du processus de reservation, nous fournirons toujours des liens permettant de verifier leurs politiques de confidentialite et conditions generales avec votre reservation.",
        ],
    },
    {
        titleKey: 'privacySection2',
        bodyKey: 'privacyBody2',
        listKey: 'privacyList2',
        paragraphs: [
            "Nous n'utilisons que les informations pour lesquelles le consentement a ete donne, et impliquees dans les situations suivantes : la prestation de services (par exemple, les reservations, etc.), la conformite ou les obligations legales, ou d'autres raisons commerciales normales.",
            'Prestation de services et reservations — Nous utilisons vos donnees pour fournir ou faciliter les contrats que vous essayez d\'executer, le plus souvent une reservation avec un fournisseur de voyages, ou avec nous.',
        ],
        list: [
            "Adaptation d'un site web a votre appareil (comme un mobile ou une tablette)",
            "Fourniture de resultats pour vos requetes de recherche correspondant a vos besoins (pays d'origine, etc.)",
            "Lorsque vous avez selectionne une offre de fournisseur de voyage, nous utilisons des informations telles que votre identifiant de peripherique, votre adresse IP et les details de recherche pour vous rediriger vers leur plateforme",
            'Lorsque nous effectuons la reservation en votre nom, nous transferons les donnees necessaires pour finaliser cette transaction (coordonnees de contact, passeport, etc.) dans le systeme du fournisseur de voyages',
            'Vous contacter avec des messages, notifications ou alertes necessaires pour fournir les services demandes (confirmations de reservation, alertes sur l\'etat du vol, mises a jour de nos services ou de cette politique)',
            'Repondre aux demandes des clients, par exemple des e-mails de service client',
            'Vous permettre de gerer tous les comptes que vous avez avec nous',
        ],
    },
    {
        titleKey: 'privacySection3',
        bodyKey: 'privacyBody3',
        paragraphs: [
            "Nous pouvons avoir besoin de conserver et d'utiliser vos informations dans le cadre de reclamations legales, ou pour des fins de conformite, de reglementation et d'audit. Par exemple, nous pouvons conserver des informations si nous y sommes tenus par la loi, ou si nous sommes contraints de le faire par une ordonnance du tribunal ou un organisme de reglementation. De plus, lorsque vous exercez les droits legaux applicables que vous avez pour acceder, modifier ou supprimer vos donnees personnelles, nous pouvons vous demander des documents d'identification et de verification pour confirmer votre identite.",
        ],
    },
    {
        titleKey: 'privacySection4',
        bodyKey: 'privacyBody4',
        listKey: 'privacyList4',
        paragraphs: [
            "Nous utilisons egalement des donnees pour ameliorer nos services et pour proteger ou promouvoir nos interets legitimes. Cela represente un eventail de choses importantes comme la securite et la fraude, et la prevention des attaques malveillantes.",
        ],
        list: [
            "Securite et prevention de la fraude : verifier l'origine du paiement, empecher les bots d'abuser de nos systemes",
            "Resolution de bugs et de situations d'affichage incorrect selon les appareils",
            "Fourniture de service client, y compris aider nos partenaires fournisseurs a comprendre votre parcours utilisateur",
            "Comprendre comment nos utilisateurs utilisent nos services, et optimiser l'experience (statistiques de reservations, analyses agregees, tests A/B)",
            "Surveiller les ouvertures/lectures de communication par e-mail et les clics",
            "Personnaliser votre utilisation de nos sites (cookies, preferences de langue et devise, historique de recherche, publicites pertinentes)",
            "Realiser des analyses de donnees strategiques a partir de demandes anonymisees de millions d'utilisateurs",
            "Traiter les candidatures faites aupres de BOOKINGO",
        ],
    },
    {
        titleKey: 'privacySection5',
        bodyKey: 'privacyBody5',
        paragraphs: [
            'Nous obtiendrons explicitement votre consentement pour des fins telles que : vous communiquer de maniere unilaterale (push) via e-mail ou messagerie (alertes de prix, bulletins d\'information), placer un cookie sur votre appareil lorsque la conformite legale locale l\'exige, ou obtenir des commentaires dans le cadre d\'une enquete.',
            "Lorsque nous traitons des donnees personnelles uniquement sur la base de votre consentement, vous pouvez retirer ce consentement a tout moment en utilisant la fonctionnalite fournie dans le produit ou en nous contactant. Pour l'utilisation du site, la reservation et l'application, votre consentement est donne par l'acceptation des conditions d'utilisation.",
        ],
    },
    {
        titleKey: 'privacySection6',
        bodyKey: 'privacyBody6',
        paragraphs: [
            "Lorsque les utilisateurs visitent nos sites ou utilisent nos applications, une myriade d'informations est collectee et stockee sur leur experience. Nous nous en tenons aux choses necessaires.",
            "Vous nous le donnez volontairement : dates et destination d'une recherche, informations pour une reservation (noms, coordonnees), avis ou photographies partagees. C'est toujours a vous de decider si vous choisissez de nous fournir ce type d'informations.",
            "Nous le generons ou le collectons automatiquement : adresse IP, informations sur l'appareil et le navigateur, URL de provenance, details des reservations effectuees, emplacement approximatif.",
            "Nous le recevons de tiers : par exemple lorsque vous venez via un partenaire promotionnel, via une connexion par reseau social, ou lorsque vous etes redirige vers un fournisseur de voyage pour finaliser une reservation.",
            "Nos services ne sont pas destines aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de donnees personnelles aupres d'enfants de moins de 13 ans, et supprimerons toute donnee que nous apprenons avoir ete collectee sans le consentement expres du parent ou tuteur legal.",
        ],
    },
    {
        titleKey: 'privacySection7',
        bodyKey: 'privacyBody7',
        listKey: 'privacyList7',
        paragraphs: [
            "Selon la maniere dont vous interagissez avec nos services, nous pouvons collecter ou traiter les categories de donnees personnelles suivantes :",
        ],
        list: [
            'Coordonnees : nom, adresse, adresse e-mail, numero de telephone',
            "Informations d'identification : details de passeport (nom, adresse, sexe, statut d'immigration, nationalite, date de naissance)",
            'Informations de paiement : numero de carte, date d\'expiration, code de verification',
            'Informations de voyage et de reservation : reference de reservation, historique, PNR, itineraire',
            'Informations demographiques : age, sexe, emplacement, langue preferee',
            "Informations sur l'appareil et l'emplacement : adresse IP, type/marque/modele d'appareil, systeme d'exploitation, donnees GPS ou localisation approximative",
            "Informations sur l'utilisation de l'application : historique de recherche, preferences de voyage, interactions avec nos sites",
            "Informations sur les preferences de l'utilisateur : consentements donnes ou refuses, preferences d'e-mail et de notifications",
            "Informations sur les communications anterieures : commentaires, demandes d'aide, requetes par e-mail ou chat",
            "Informations sur l'emploi ou contenu fourni : signatures, photographies, historique professionnel lors d'une candidature",
            "Informations liees aux medias sociaux : adresse e-mail collectee lors d'une connexion via reseau social, informations de profil public",
        ],
    },
    {
        titleKey: 'privacySection8',
        bodyKey: 'privacyBody8',
        paragraphs: [
            "Notre politique consiste a ne conserver les donnees que pendant la duree necessaire pour satisfaire aux exigences legales, ou pendant que nous les utilisons pour vous fournir des services. Une fois cette periode ecoulee, nous pouvons anonymiser et agreger les donnees, ou les supprimer conformement aux meilleures pratiques. Vous pouvez nous demander de supprimer vos donnees personnelles a tout moment.",
            "Si vous avez un compte BOOKINGO, nous conserverons des donnees personnelles telles que votre adresse e-mail et votre nom aussi longtemps que vous le souhaitez, et eventuellement un certain temps apres la resiliation de votre compte pour respecter des obligations legales ou proteger nos interets legitimes.",
            "La plupart des donnees collectees pour la reservation sont utilisees pour finaliser celle-ci et ne sont conservees que pour une duree limitee, sauf obligation legale contraire.",
        ],
    },
    {
        titleKey: 'privacySection9',
        bodyKey: 'privacyBody9',
        paragraphs: [
            "Si vous achetez un voyage aupres d'un Fournisseur de Voyage depuis notre plateforme (Reservation Instantanee via BOOKINGO), les donnees personnelles soumises dans le cadre de la reservation peuvent etre partagees avec ce Fournisseur de Voyage ou un tiers contracte pour fournir des services en leur nom. Vous aurez toujours l'occasion de consulter la politique de confidentialite du Fournisseur de Voyage au prealable.",
            "Nous partagerons des donnees personnelles avec des tiers lorsque vous nous y aurez expressement autorises, par exemple dans le cadre d'une promotion en collaboration avec un partenaire.",
            "Certaines informations peuvent egalement etre collectees par des tiers (annonceurs, reseaux marketing, affilies) via des cookies et technologies similaires, afin de vous servir une publicite pertinente. Ces informations n'incluront jamais votre nom, vos coordonnees ou d'autres informations permettant de vous identifier hors ligne.",
        ],
    },
];

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyModal = ({ isOpen, onClose }: PrivacyModalProps) => {
    const { t, language } = useLanguage();

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4"
            style={{ background: 'rgba(15, 23, 42, 0.55)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label={t('flightClose')}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-6 md:px-10 pt-8 md:pt-10 pb-8 max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Shield className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#0B1E5C]">
                                {t('privacyPolicy')}
                            </h2>
                            <p className="text-gray-500 mt-1 text-sm">
                                {t('privacyModalIntro')}
                            </p>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="flex flex-col gap-6 mt-8">
                        {sections.map((section, i) => {
                            const paragraphs = language === 'fr'
                                ? section.paragraphs
                                : t(section.bodyKey).split('\n\n');
                            const listItems = language === 'fr'
                                ? section.list
                                : section.listKey ? t(section.listKey).split('\n') : undefined;

                            return (
                            <div key={i}>
                                {section.titleKey && (
                                    <h3 className="font-bold text-[#0B1E5C] mb-2">{t(section.titleKey)}</h3>
                                )}
                                {paragraphs.map((p, j) => (
                                    <p key={j} className="text-sm text-gray-500 leading-relaxed mb-3">
                                        {p}
                                    </p>
                                ))}
                                {listItems && (
                                    <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-2">
                                        {listItems.map((item, k) => (
                                            <li key={k} className="text-sm text-gray-500 leading-relaxed">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {i < sections.length - 1 && (
                                    <div className="border-t border-gray-100 mt-6" />
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;