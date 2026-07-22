document.addEventListener('DOMContentLoaded', async () => {
    const { data: siteContent, error } = await supabase
        .from('site_content')
        .select('*');

    let contentMap = {};
    if (siteContent && siteContent.length > 0) {
        siteContent.forEach(item => {
            contentMap[item.section] = item.data;
        });
    } else {
        // Default content if database is empty
        const defaultContent = {
            header: { title: "Portfolio" },
            hero: {
                title: "Mpaka sary / Videographer",
                subtitle: "Mamorona sy manaitra. Manatsara ny orinasanao amin'ny alalan'ny sary sy horonan-tsary kalitao.",
                image: "https://images.unsplash.com/photo-1510511459019-5dda7724fdde?auto=format&fit=crop&w=1600&q=80",
                ctaText: "Jereo ny Portfolio-ko",
                ctaLink: "#tetikasa"
            },
            about: {
                title: "Momba ahy",
                text: "Manam-pahaizana manokana amin'ny fakana sary sy horonan-tsary aho, manampy ny orinasa hanatsara ny marikany amin'ny alalan'ny tantara hita maso. Ny tanjoko dia ny mamorona votoaty manaitra sy mampahatsiahy izay mampifandray amin'ny mpihaino anao.",
                processHighlight: "Ny fizotry ny famoronana sy ny fomba fiasako no singa manan-danja indrindra amin'ny tetikasako rehetra.",
                image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
            },
            projects: {
                title: "Tetikasa vao haingana",
                items: [
                    { id: 1, title: "Tetikasa 1: Sary ho an'ny Orinasa", description: "Sary matihanina ho an'ny fampiroboroboana ny marika.", image: "https://images.unsplash.com/photo-1502945015378-0e285144c003?auto=format&fit=crop&w=600&q=80" },
                    { id: 2, title: "Tetikasa 2: Horonan-tsary Fampahafantarana", description: "Horonan-tsary fampahafantarana mampiseho ny tantaran'ny orinasa.", image: "https://images.unsplash.com/photo-1453835602414-b63013df83c9?auto=format&fit=crop&w=600&q=80" },
                    { id: 3, title: "Tetikasa 3: Sary ho an'ny Fanjifana", description: "Sary vokatra manaitra ho an'ny e-commerce.", image: "https://images.unsplash.com/photo-1517036616028-2045e754a1be?auto=format&fit=crop&w=600&q=80" }
                ]
            },
            skills: {
                title: "Ireo fahaizako",
                items: [
                    { id: 1, name: "Fakàna sary matihanina", description: "Sary avo lenta ho an'ny fampiroboroboana sy dokambarotra." },
                    { id: 2, name: "Famoronana horonan-tsary", description: "Fanamboarana horonan-tsary fampahafantarana, dokambarotra ary hetsika." },
                    { id: 3, name: "Fanovana sary sy horonan-tsary", description: "Fanodinana matihanina amin'ny alalan'ny Adobe Photoshop, Lightroom, Premiere Pro." },
                    { id: 4, name: "Fitantanana tetikasa", description: "Fikarakarana sy fanaraha-maso ny tetikasa sary/horonan-tsary hatramin'ny farany." }
                ]
            },
            contact: {
                title: "Andao hifandray",
                text: "Vonona ny hiara-hiasa aminao aho mba hamorona votoaty hita maso miavaka. Aza misalasala mifandray amin'ny alalan'ny WhatsApp na mailaka.",
                whatsapp: "+33612345678",
                email: "contact@example.com"
            },
            footer: {
                text: "Portfolio. Zo rehetra voatokana."
            }
        };

        for (const section in defaultContent) {
            await supabase.from('site_content').upsert({ section: section, data: defaultContent[section] });
        }
        const { data: updatedContent } = await supabase.from('site_content').select('*');
        updatedContent.forEach(item => { contentMap[item.section] = item.data; });
    }

    // Populate header
    document.querySelector('title').textContent = contentMap.header.title + ' - Mpaka sary / Videographer';
    document.querySelector('nav a').textContent = contentMap.header.title;

    // Populate hero section
    document.getElementById('hero-title').textContent = contentMap.hero.title;
    document.getElementById('hero-subtitle').textContent = contentMap.hero.subtitle;
    document.getElementById('hero-image').src = contentMap.hero.image;
    document.getElementById('hero-cta').textContent = contentMap.hero.ctaText;
    document.getElementById('hero-cta').href = contentMap.hero.ctaLink;

    // Populate about section
    document.getElementById('about-title').textContent = contentMap.about.title;
    document.getElementById('about-text').textContent = contentMap.about.text;
    document.getElementById('about-process-highlight').textContent = contentMap.about.processHighlight;
    document.getElementById('about-image').src = contentMap.about.image;

    // Populate projects section
    document.getElementById('projects-title').textContent = contentMap.projects.title;
    const projectsGrid = document.getElementById('projects-grid');
    projectsGrid.innerHTML = '';
    contentMap.projects.items.forEach(project => {
        const projectCard = `
            <div class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden animate-fade-in-up">
                <img src="${project.image}" alt="${project.title}" class="w-full h-64 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-display font-semibold text-gray-900 mb-2">${project.title}</h3>
                    <p class="text-gray-600">${project.description}</p>
                </div>
            </div>
        `;
        projectsGrid.insertAdjacentHTML('beforeend', projectCard);
    });

    // Populate skills section
    document.getElementById('skills-title').textContent = contentMap.skills.title;
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    contentMap.skills.items.forEach(skill => {
        const skillCard = `
            <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in-up">
                <h3 class="text-xl font-display font-semibold text-gray-900 mb-2">${skill.name}</h3>
                <p class="text-gray-600">${skill.description}</p>
            </div>
        `;
        skillsList.insertAdjacentHTML('beforeend', skillCard);
    });

    // Populate contact section
    document.getElementById('contact-title').textContent = contentMap.contact.title;
    document.getElementById('contact-text').textContent = contentMap.contact.text;
    document.getElementById('whatsapp-link').href = `https://wa.me/${contentMap.contact.whatsapp.replace(/\s/g, '')}`;
    document.getElementById('email-link').href = `mailto:${contentMap.contact.email}`;

    // Populate footer
    document.getElementById('footer-text').innerHTML = `&copy; <span id="current-year">${new Date().getFullYear()}</span> ${contentMap.footer.text}`;

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
