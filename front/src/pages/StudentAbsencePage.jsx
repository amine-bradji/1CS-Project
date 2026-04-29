import { useState } from "react"
import styles from "./studentAbsencePage.module.css"

// Icons as SVG components
function LayoutDashboard({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    )
}

function FileText({ className }) {
    return (
        <img
            src="/Icons/absence.png"
            className={className}
            width="24"
            height="24"
            alt="absence icon"
        />
    )
}

function FileCheck({ className }) {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
        />
    );
}

function RotateCcw({ className }) {
    return (
        <img
            src="/Icons/rattrapageIcon.png"
            className={className}
            width="24"
            height="24"
            alt="rattrapage icon"
        />
    )
}

function UserCheck({ className }) {
    return (
        <img
            src="/Icons/checkinIcon.png"
            className={className}
            width="24"
            height="24"
            alt="checkin icon"
        />
    )
}

function Bell({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    )
}

function Settings({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function Search({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    )
}

function Calendar({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
        </svg>
    )
}

function Filter({ className }) {
    return (
        <img
            src="/Icons/filterIcon.png"
            className={className}
            width="24"
            height="24"
            alt="filter icon"
        />
    )
}

function ChevronDown({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

function ChevronLeft({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    )
}

function ChevronRight({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}

// Navigation items data
const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: false, path: "/DashboardStudent" },
    { icon: FileText, label: "Absences", active: true, path: "/StudentAbsencePage" },
    { icon: FileCheck, label: "Justificatifs", active: false, path: "/Justification" },
    { icon: RotateCcw, label: "Rattrapages", active: false, path: "/Rattrapage" },
    { icon: UserCheck, label: "Check-in (Présence)", active: false, path: "/Check-in" },
    { icon: Bell, label: "Notifications", active: false, badge: 3, path: "/Notifications" },
]

// Absences data
const absences = [
    {
        id: 1,
        date: "12/10/2023",
        time: "08:30 - 10:00",
        module: "Systèmes d'Exploitation",
        type: "TD",
        room: "Salle 12",
        status: "justified",
    },
    {
        id: 2,
        date: "10/10/2023",
        time: "10:15 - 11:45",
        module: "Génie Logiciel",
        type: "Cours",
        room: "Amphi A",
        status: "unjustified",
    },
    {
        id: 3,
        date: "05/10/2023",
        time: "13:00 - 14:30",
        module: "Réseaux",
        type: "TP",
        room: "Labo 3",
        status: "pending",
    },
    {
        id: 4,
        date: "28/09/2023",
        time: "14:45 - 16:15",
        module: "Architecture des Ordinateurs",
        type: "Cours",
        room: "Amphi B",
        status: "justified",
    },
    {
        id: 5,
        date: "15/09/2023",
        time: "08:30 - 10:00",
        module: "Algorithmique Avancée",
        type: "TD",
        room: "Salle 15",
        status: "unjustified",
    },
]

// Status configuration
const statusConfig = {
    justified: {
        label: "Justifiée",
        className: styles["status-justified"],
    },
    unjustified: {
        label: "Injustifiée",
        className: styles["status-unjustified"],
    },
    pending: {
        label: "En attente",
        className: styles["status-pending"],
    },
}

// Image component to handle both remote and local images
function Image({ src, alt, width, height, className }) {
    // If it's a remote URL starting with http, use img tag
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        return <img src={src} alt={alt} width={width} height={height} className={className} />
    }
    // Otherwise use img tag with local path
    return <img src={src} alt={alt} width={width} height={height} className={className} />
}

// Sidebar Component
function Sidebar() {
    return (
        <aside className={styles["sidebar"]}>
            <div className={styles["sidebar-logo"]}>
                <div className={styles["logo-circle"]}>
                    <Image
                        src="/images/logo.png"
                        alt="ESI SBA Logo"
                        width={32}
                        height={32}
                        className={styles["logo-image"]}
                    />
                </div>
                <div>
                    <h1 className={styles["logo-title"]}>ESI SBA</h1>
                    <p className={styles["logo-subtitle"]}>Absence Portal</p>
                </div>
            </div>

            <nav className={styles["sidebar-nav"]}>
                {navItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.path}
                        className={`${styles["nav-item"]} ${item.active ? styles["nav-item-active"] : ""}`}
                    >
                        <item.icon className={styles["nav-icon"]} />
                        <span className={styles["nav-label"]}>{item.label}</span>
                        {item.badge && (
                            <span className={styles["nav-badge"]}>{item.badge}</span>
                        )}
                    </a>
                ))}
            </nav>

            <div className={styles["sidebar-settings"]}>
                <a href="#" className={styles["setting-item"]}>
                    <Settings className={styles["nav-icon"]} />
                    <span className={styles["settingtext"]}>System Settings</span>
                </a>
            </div>

            <div className={styles["sidebar-profile"]}>
                <div className={styles["profile-avatar"]}>
                    <Image
                        src="/Icons/Teacher Avatar.png"
                        alt="Dr. Ahmed Yelles"
                        width={40}
                        height={40}
                        className={styles["avatar-image"]}
                    />
                </div>
                <div>
                    <p className={styles["profile-name"]}>Dr. Ahmed Yelles</p>
                    <p className={styles["profile-role"]}>Professor</p>
                </div>
            </div>
        </aside>
    )
}

// Header Component
function Header() {
    return (
        <header className={styles["header"]}>
            <div className={styles["header-content"]}>
                <button className={styles["notification-btn"]}>
                    <Bell className={styles["notification-icon"]} />
                    <span className={styles["notification-dot"]}></span>
                </button>

                <div className={styles["user-profile"]}>
                    <div className={styles["user-info"]}>
                        <p className={styles["user-name"]}>Amine B.</p>
                        <p className={styles["user-role"]}>3ème Année SI</p>
                    </div>
                    <div className={styles["user-avatar"]}>
                        <Image
                            src="/Icons/studentPicture.png"
                            alt="Amine B."
                            width={40}
                            height={40}
                            className={styles["avatar-image"]}
                        />
                    </div>
                    <ChevronDown className={styles["chevron-icon"]} />
                </div>
            </div>
        </header>
    )
}

// Absences Table Component
function AbsencesTable() {
    const [currentPage, setCurrentPage] = useState(1)

    return (
        <div className={styles["table-container"]}>
            <div className={styles["filters"]}>
                <div className={styles["search-container"]}>
                    <Search className={styles["search-icon"]} />
                    <input
                        type="text"
                        placeholder="Rechercher un module..."
                        className={styles["search-input"]}
                    />
                </div>

                <button className={`${styles["filter-btn"]} ${styles["filter-btn-light"]}`}>
                    <Calendar className={styles["filter-icon"]} />
                    <div className={styles["filter-text"]}>
                        <p className={styles["filter-label"]}>Semestre</p>
                        <p className={styles["filter-value"]}>1</p>
                    </div>
                    <ChevronDown className={styles["chevron-small"]} />
                </button>

                <button className={`${styles["filter-btn"]} ${styles["filter-btn-dark"]}`}>
                    <Filter className={styles["filter-icon"]} />
                    <div className={styles["filter-text"]}>
                        <p className={styles["filter-label"]}>Tous les</p>
                        <p className={styles["filter-value"]}>statuts</p>
                    </div>
                    <ChevronDown className={styles["chevron-small"]} />
                </button>
            </div>

            <div className={styles["table-wrapper"]}>
                <table className={styles["table"]}>
                    <thead>
                        <tr className={styles["table-header"]}>
                            <th>Date & Heure</th>
                            <th>Module</th>
                            <th>Type & Salle</th>
                            <th>Statut</th>
                            <th className={styles["text-center"]}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {absences.map((absence) => (
                            <tr key={absence.id}>
                                <td>
                                    <p className={styles["cell-primary"]}>{absence.date}</p>
                                    <p className={styles["cell-secondary"]}>{absence.time}</p>
                                </td>
                                <td>
                                    <p className={styles["cell-primary"]}>{absence.module}</p>
                                </td>
                                <td>
                                    <p className={styles["cell-primary"]}>{absence.type}</p>
                                    <p className={styles["cell-secondary"]}>{absence.room}</p>
                                </td>
                                <td>
                                    <span className={`${styles["status-badge"]} ${statusConfig[absence.status].className}`}>
                                        {statusConfig[absence.status].label}
                                    </span>
                                </td>
                                <td className={styles["text-center"]}>
                                    {absence.status === "unjustified" ? (
                                        <button className={styles["action-btn"]}>
                                            Justifier
                                        </button>
                                    ) : (
                                        <span className={styles["no-action"]}>Aucune action</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles["pagination"]}>
                <p className={styles["pagination-info"]}>
                    Affichage de 1 à 5 sur 12 absences
                </p>
                <div className={styles["pagination-controls"]}>
                    <button className={styles["pagination-btn"]} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                        <ChevronLeft className={styles["pagination-icon"]} />
                    </button>
                    {[1, 2, 3].map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`${styles["pagination-number"]} ${currentPage === page ? styles["pagination-active"] : ""}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button className={styles["pagination-btn"]} onClick={() => setCurrentPage(prev => Math.min(3, prev + 1))}>
                        <ChevronRight className={styles["pagination-icon"]} />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Main Page Component
export default function StudentAbsencePage() {
    return (
        <div className={styles["page-container"]}>
            <Sidebar />
            <div className={styles["main-content"]}>
                <Header />
                <main className={styles["content-area"]}>
                    <AbsencesTable />
                </main>
            </div>
        </div>
    )
}