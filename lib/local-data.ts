import type { Localisation, OffreDetail } from './api-types'
import { civilDatePlus } from './dates'

/**
 * Jeu de données local, au format exact de l'API publique.
 *
 * Il reprend les offres et les zones géographiques qui figuraient déjà dans
 * le landing (Maison Atlas, Ville de Montreuil, Lumen Industries, Novatek,
 * Groupe Horizon, Logisphère ; France, Canada, Maroc, Sénégal, Émirats,
 * Singapour, Australie) et sert de repli tant que l'API n'est pas joignable.
 *
 * Les dates limites sont relatives au jour courant pour que la logique
 * « expire dans N jours » soit exercée avec de vraies échéances.
 */

const lieux: Record<string, Localisation> = {
  paris: { lieu: 'Paris', region: 'europe', region_libelle: 'Europe', lat: 48.9, lon: 2.4 },
  montreuil: { lieu: 'Montreuil', region: 'europe', region_libelle: 'Europe', lat: 48.86, lon: 2.44 },
  lyon: { lieu: 'Lyon', region: 'europe', region_libelle: 'Europe', lat: 45.76, lon: 4.84 },
  bordeaux: { lieu: 'Bordeaux', region: 'europe', region_libelle: 'Europe', lat: 44.84, lon: -0.58 },
  nantes: { lieu: 'Nantes', region: 'europe', region_libelle: 'Europe', lat: 47.22, lon: -1.55 },
  marseille: { lieu: 'Marseille', region: 'europe', region_libelle: 'Europe', lat: 43.3, lon: 5.37 },
  canada: { lieu: 'Canada', region: 'ameriques', region_libelle: 'Amériques', lat: 56.1, lon: -106.3 },
  maroc: { lieu: 'Maroc', region: 'afrique', region_libelle: 'Afrique', lat: 31.8, lon: -6.2 },
  senegal: { lieu: 'Sénégal', region: 'afrique', region_libelle: 'Afrique', lat: 14.5, lon: -14.5 },
  eau: { lieu: 'Émirats arabes unis', region: 'moyen-orient', region_libelle: 'Moyen-Orient', lat: 24.4, lon: 54.3 },
  singapour: { lieu: 'Singapour', region: 'asie-pacifique', region_libelle: 'Asie-Pacifique', lat: 1.35, lon: 103.8 },
  australie: { lieu: 'Australie', region: 'asie-pacifique', region_libelle: 'Asie-Pacifique', lat: -25.3, lon: 133.7 },
  antananarivo: { lieu: 'Antananarivo', region: 'madagascar', region_libelle: 'Madagascar', lat: -18.9, lon: 47.5 },
}

const pays: Record<string, string> = {
  paris: 'France', montreuil: 'France', lyon: 'France', bordeaux: 'France', nantes: 'France',
  marseille: 'France', canada: 'Canada', maroc: 'Maroc', senegal: 'Sénégal',
  eau: 'Émirats arabes unis', singapour: 'Singapour', australie: 'Australie',
  antananarivo: 'Madagascar',
}

type Seed = [
  titre: string,
  organisation: string,
  secteur: string,
  categorie: string,
  lieu: keyof typeof lieux,
  source: string,
  nature: 'marche' | 'emploi',
  /** jours avant l'échéance (négatif = expirée, null = sans date) */
  echeance: number | null,
  /** jours depuis la publication */
  publie: number,
  description: string,
]

const seeds: Seed[] = [
  ['Refonte plateforme e-commerce', 'Maison Atlas', 'informatique', 'Développement web', 'paris', 'boamp', 'marche', 3, 12,
    'Refonte complète de la plateforme e-commerce : catalogue, tunnel de commande, espace client et intégration ERP. Le prestataire assurera la conception, le développement et la mise en production, avec une phase de reprise de données.'],
  ['Construction d’un complexe sportif', 'Ville de Montreuil', 'construction', 'Bâtiment public', 'montreuil', 'boamp', 'marche', 6, 20,
    'Construction d’un complexe sportif comprenant un gymnase, une salle polyvalente et des vestiaires. Marché de travaux en lots séparés : gros œuvre, charpente, second œuvre, VRD.'],
  ['Accompagnement stratégie RSE', 'Lumen Industries', 'environnement', 'Conseil', 'lyon', 'boamp', 'marche', 1, 8,
    'Mission de conseil pour définir et déployer la stratégie RSE du groupe : diagnostic, feuille de route, indicateurs et accompagnement au reporting extra-financier.'],
  ['Campagne marketing digital 2026', 'Novatek', 'informatique', 'Marketing', 'bordeaux', 'boamp', 'marche', 0, 15,
    'Conception et pilotage d’une campagne d’acquisition multicanale (search, social, display) sur douze mois, avec reporting mensuel et optimisation continue.'],
  ['Maintenance préventive des sites', 'Groupe Horizon', 'construction', 'Maintenance', 'nantes', 'boamp', 'marche', 5, 10,
    'Contrat de maintenance préventive et corrective de quinze sites tertiaires : CVC, électricité, plomberie et contrôles réglementaires.'],
  ['Flotte de véhicules utilitaires', 'Logisphère', 'construction', 'Fournitures', 'marseille', 'boamp', 'marche', -4, 40,
    'Acquisition de trente véhicules utilitaires légers, motorisation électrique, livraison échelonnée sur six mois avec contrat d’entretien.'],
  ['Audit cybersécurité groupe', 'Maison Atlas', 'informatique', 'Sécurité', 'paris', 'boamp', 'marche', 7, 6,
    'Audit de sécurité du système d’information : tests d’intrusion externes et internes, revue de configuration cloud et plan de remédiation priorisé.'],
  ['Modernisation réseau télécom', 'Ville de Montreuil', 'informatique', 'Télécommunications', 'montreuil', 'boamp', 'marche', 12, 9,
    'Renouvellement de l’infrastructure réseau des bâtiments municipaux : cœur de réseau, Wi-Fi, téléphonie IP et supervision.'],
  ['Fournitures bureaux responsables', 'Lumen Industries', 'environnement', 'Fournitures', 'lyon', 'boamp', 'marche', 4, 11,
    'Accord-cadre de fournitures de bureau éco-labellisées pour l’ensemble des établissements du groupe, sur trois ans.'],
  ['Pilotage programme finance', 'Groupe Horizon', 'informatique', 'Conseil', 'nantes', 'boamp', 'marche', 18, 4,
    'Assistance à maîtrise d’ouvrage pour la mise en place d’un nouvel outil de pilotage financier et la conduite du changement associée.'],
  ['Application mobile citoyenne', 'Ville de Montreuil', 'informatique', 'Développement mobile', 'montreuil', 'boamp', 'marche', 2, 14,
    'Développement d’une application mobile (iOS/Android) de services aux habitants : signalements, démarches, actualités et notifications.'],
  ['Étude transport bas carbone', 'Logisphère', 'environnement', 'Étude', 'marseille', 'boamp', 'marche', -1, 35,
    'Étude de faisabilité pour la décarbonation de la flotte et des tournées : scénarios, coûts, calendrier et impacts opérationnels.'],
  ['Identité de marque 2026', 'Novatek', 'informatique', 'Marketing', 'bordeaux', 'boamp', 'marche', 9, 7,
    'Refonte de l’identité visuelle : plateforme de marque, logotype, charte et déclinaisons print et digitales.'],
  ['Rénovation siège social', 'Lumen Industries', 'construction', 'Bâtiment', 'lyon', 'boamp', 'marche', 25, 5,
    'Rénovation énergétique et réaménagement du siège social : isolation, menuiseries, CVC et espaces de travail.'],
  ['Centre de support externalisé', 'Maison Atlas', 'informatique', 'Services', 'paris', 'boamp', 'marche', 6, 13,
    'Externalisation du support client niveau 1 et 2, en français et en anglais, 7 j/7, avec engagements de niveau de service.'],
  ['Solution achats prédictifs', 'Groupe Horizon', 'informatique', 'Logiciel', 'nantes', 'boamp', 'marche', 30, 3,
    'Mise en œuvre d’une solution d’analyse prédictive des achats intégrée à l’ERP, incluant licences, intégration et formation.'],
  ['Transport express national', 'Logisphère', 'construction', 'Transport', 'marseille', 'boamp', 'marche', 3, 9,
    'Prestation de transport express de colis sur le territoire national, enlèvement quotidien et suivi en temps réel.'],
  ['Sécurisation entrepôts', 'Maison Atlas', 'construction', 'Sécurité', 'paris', 'boamp', 'marche', 14, 6,
    'Fourniture et installation de systèmes de vidéosurveillance, contrôle d’accès et détection d’intrusion sur quatre entrepôts.'],
  ['Conseil financement innovation', 'Lumen Industries', 'informatique', 'Conseil', 'lyon', 'boamp', 'marche', 5, 8,
    'Accompagnement à l’identification et au montage de dossiers de financement public et européen pour les projets d’innovation.'],
  ['Équipements chantier', 'Ville de Montreuil', 'construction', 'Fournitures', 'montreuil', 'boamp', 'marche', null, 22,
    'Fourniture d’équipements et d’outillage de chantier pour les services techniques municipaux.'],
  // Zones internationales de l'ancienne carte du landing
  ['Réseau d’eau potable en zone rurale', 'Ministère de l’Hydraulique', 'eau', 'Infrastructure', 'senegal', 'banquemondiale', 'marche', 6, 18,
    'Travaux d’extension du réseau d’adduction d’eau potable dans trois communes rurales, forages, châteaux d’eau et bornes-fontaines.'],
  ['Programme agricole résilient', 'Agence de développement agricole', 'agriculture', 'Programme', 'maroc', 'bad', 'marche', 2, 16,
    'Fourniture d’intrants, formation des coopératives et mise en place de périmètres irrigués dans la région de Souss-Massa.'],
  ['Chef de projet énergies renouvelables', 'Agence internationale', 'environnement', 'Recrutement', 'eau', 'unjobnet', 'emploi', 4, 5,
    'Poste de chef de projet pour le déploiement de centrales solaires décentralisées, contrat de deux ans, basé à Abou Dabi.'],
  ['Plateforme de données portuaires', 'Autorité portuaire', 'informatique', 'Logiciel', 'singapour', 'ted', 'marche', 11, 12,
    'Conception d’une plateforme d’échange de données logistiques entre les acteurs du port, API, tableau de bord et hébergement.'],
  ['Restauration d’écosystèmes côtiers', 'Fondation océans', 'environnement', 'Programme', 'australie', 'wwf', 'marche', 1, 20,
    'Programme de restauration de mangroves et de récifs : études, plantations, suivi scientifique sur trois ans.'],
  ['Rénovation d’écoles primaires', 'Commission scolaire', 'construction', 'Bâtiment public', 'canada', 'ted', 'marche', 8, 10,
    'Rénovation de six écoles primaires : toitures, fenestration, ventilation et mise aux normes d’accessibilité.'],
  ['Système d’information hospitalier', 'Ministère de la Santé', 'informatique', 'Logiciel', 'antananarivo', 'armp', 'marche', 5, 14,
    'Fourniture, déploiement et maintenance d’un système d’information hospitalier pour quatre centres hospitaliers universitaires.'],
  ['Spécialiste suivi-évaluation', 'Programme des Nations unies', 'environnement', 'Recrutement', 'antananarivo', 'unjobnet', 'emploi', 7, 3,
    'Recrutement d’un spécialiste en suivi-évaluation pour un programme de résilience climatique, contrat d’un an renouvelable.'],
]

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString()

export const localOffres: OffreDetail[] = seeds.map((s, i) => {
  const [titre, organisation, secteur, categorie, lieu, source, nature, echeance, publie, description] = s
  const date_limite = echeance === null ? null : civilDatePlus(echeance)
  return {
    id: `local-${String(i + 1).padStart(3, '0')}`,
    source,
    titre,
    organisation,
    pays: pays[lieu],
    localisation: lieux[lieu],
    nature,
    secteur,
    categorie,
    date_publication: civilDatePlus(-publie),
    date_limite,
    jours_restants: echeance,
    urgente: echeance !== null && echeance >= 0 && echeance <= 7,
    ouverte: echeance === null || echeance >= 0,
    lien: null,
    lien_etat: null,
    date_ajout: iso(publie),
    date_maj: iso(Math.max(0, publie - 2)),
    description,
    raison: null,
  }
})

export const localCollecte = iso(0)
