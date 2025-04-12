document.addEventListener('alpine:init', () => {
    Alpine.data('sidemenu', () => ({
        menus: [
            { name: 'Home', icon: 'fa fa-home', id: 'home', url: '#home' },
            { name: 'About Me', icon: 'fa fa-user', id: 'about', url: '#about' },
            { name: 'Portfolio', icon: 'fa fa-palette', id: 'portfolio', url: '#portfolio' },
            { name: 'Blog', icon: 'fa fa-blog', id: 'blog', url: '#blog' },
            { name: 'Contact', icon: 'fa fa-envelope', id: 'contact', url: '#contact' },
            { name: 'Resume', icon: 'fa fa-file', id: 'resume', url: '#resume' }
        ],
        activeMenu: 'home',
        setActiveMenu(menu) {
            this.activeMenu = menu;
            this.$dispatch('menu-selected', { activeMenu: this.activeMenu });
        }
    }))
})