document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est connecté
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Définir les éléments
    const passwordTable = document.getElementById('passwordTable');
    let passwords = JSON.parse(localStorage.getItem(`passwords_${loggedInUser.email}`)) || [];

    // Charger les mots de passe stockés
    loadPasswords();

    // Gestion du formulaire d'ajout de mot de passe
    document.getElementById('passwordForm').onsubmit = function(event) {
        event.preventDefault();
        
        const website = document.getElementById('website').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const newPassword = { website, username, password };
        passwords.push(newPassword);
        
        localStorage.setItem(`passwords_${loggedInUser.email}`, JSON.stringify(passwords));
        addPasswordToTable(newPassword);
        document.getElementById('passwordForm').reset();
    };

    // Charger les mots de passe dans la table
    function loadPasswords() {
        passwordTable.innerHTML = ''; // Effacer le contenu de la table
        passwords.forEach(password => addPasswordToTable(password));
    }

    // Ajouter un mot de passe à la table
    function addPasswordToTable(passwordObj) {
        const row = passwordTable.insertRow();
        row.classList.add('password-row');

        const websiteCell = row.insertCell(0);
        const usernameCell = row.insertCell(1);
        const passwordCell = row.insertCell(2);
        const actionsCell = row.insertCell(3);

        websiteCell.textContent = passwordObj.website;
        usernameCell.textContent = passwordObj.username;
        passwordCell.innerHTML = `<input type="password" value="${passwordObj.password}" readonly>`;
        actionsCell.innerHTML = `
            <button onclick="copyPassword(this)" class="copy-btn"><i class="fas fa-copy"></i></button>
            <button onclick="deletePassword(this, '${passwordObj.website}')" class="delete-btn"><i class="fas fa-trash"></i></button>
        `;
    }

    // Copier le mot de passe
    window.copyPassword = function(button) {
        const passwordInput = button.closest('tr').querySelector('input');
        passwordInput.type = "text";
        passwordInput.select();
        document.execCommand("copy");
        passwordInput.type = "password";
        alert("Mot de passe copié !");
    };

    // Supprimer un mot de passe
    window.deletePassword = function(button, website) {
        const row = button.closest('tr');
        row.classList.add('fade-out');

        row.addEventListener('transitionend', () => {
            row.remove();
            passwords = passwords.filter(p => p.website !== website);
            localStorage.setItem(`passwords_${loggedInUser.email}`, JSON.stringify(passwords));
        });
    };

    // Générer un mot de passe
    window.generatePassword = function() {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        document.getElementById('generatedPassword').value = password;
    };

    // Déconnexion
    window.logout = function() {
        if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        }
    };

    // Gestion du thème et de la taille de la police
    const themeToggle = document.getElementById('themeToggle');
    const fontSizeSelect = document.getElementById('fontSize');

    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';

    // Appliquer les paramètres sauvegardés
    applyTheme(savedTheme);
    applyFontSize(savedFontSize);

    themeToggle.value = savedTheme;
    fontSizeSelect.value = savedFontSize;

    themeToggle.addEventListener('change', function() {
        applyTheme(this.value);
        localStorage.setItem('theme', this.value);
    });

    fontSizeSelect.addEventListener('change', function() {
        applyFontSize(this.value);
        localStorage.setItem('fontSize', this.value);
    });

    // Fonction pour appliquer le thème
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme); // Utiliser data-attribute pour cibler tous les éléments
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
    }

    // Fonction pour appliquer la taille de police
    function applyFontSize(fontSize) {
        document.documentElement.style.fontSize = fontSize === 'small' ? '12px' : fontSize === 'large' ? '20px' : '16px';
    }

    // Exporter les mots de passe en CSV
    document.getElementById('exportCSV').addEventListener('click', function() {
        if (passwords.length === 0) {
            alert("Aucun mot de passe à exporter.");
            return;
        }

        function escapeCSVValue(value) {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = value.replace(/"/g, '""');
                value = `"${value}"`;
            }
            return value;
        }

        const headers = ["Service", "Nom d'utilisateur", "Mot de passe"];
        const rows = passwords.map(passwordObj => [
            escapeCSVValue(passwordObj.website),
            escapeCSVValue(passwordObj.username),
            escapeCSVValue(passwordObj.password)
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "passwords.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Importer les mots de passe à partir d'un fichier CSV
    document.getElementById('importCSV').addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const rows = content.split('\n');

            rows.forEach((row, index) => {
                if (index === 0) return; // Ignorer l'en-tête

                const columns = row.split(',');
                if (columns.length < 3) return; // Vérifie qu'il y a au moins 3 colonnes

                const service = columns[0].trim();
                const username = columns[1].trim();
                const password = columns[2].trim();

                if (service && username && password) {
                    const newPassword = { website: service, username: username, password: password };
                    passwords.push(newPassword);
                    addPasswordToTable(newPassword);
                }
            });

            localStorage.setItem(`passwords_${loggedInUser.email}`, JSON.stringify(passwords));
        };

        reader.readAsText(file);
    });

    // Gestion du défilement vers les sections
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const cards = document.querySelectorAll('.card');

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetCard = document.getElementById(targetId);

            cards.forEach(card => card.classList.remove('active'));
            targetCard.classList.add('active');
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Gestion du changement de thème (mode sombre / mode clair)
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
  
    themeToggle.addEventListener("change", function () {
      if (this.checked) {
        body.classList.remove("light-theme");
        body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark-theme"); // Enregistrer le thème dans le stockage local
      } else {
        body.classList.remove("dark-theme");
        body.classList.add("light-theme");
        localStorage.setItem("theme", "light-theme"); // Enregistrer le thème dans le stockage local
      }
    });
  
    // Appliquer le thème au chargement de la page
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      body.classList.remove("light-theme", "dark-theme");
      body.classList.add(savedTheme);
      themeToggle.checked = savedTheme === "dark-theme";
    }
  
    // Gestion de la taille de la police
    const fontSizeSelect = document.getElementById("fontSize");
  
    fontSizeSelect.addEventListener("change", function () {
      const selectedFontSize = this.value;
      body.classList.remove("small-font", "medium-font", "large-font");
      body.classList.add(`${selectedFontSize}-font`);
      localStorage.setItem("fontSize", selectedFontSize); // Enregistrer la taille de la police dans le stockage local
    });
  
    // Appliquer la taille de la police au chargement de la page
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      body.classList.remove("small-font", "medium-font", "large-font");
      body.classList.add(`${savedFontSize}-font`);
      fontSizeSelect.value = savedFontSize;
    }
  });
  