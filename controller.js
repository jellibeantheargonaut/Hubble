async function getAppsList(){
    const apps = await window.hubbleAPI.getApps();
    const container = document.querySelector('.default-container');
    container.innerHTML = '';
    apps.forEach(app => {
        const appContainer = document.createElement('div');
        appContainer.classList.add('default-item');
        const appIconConatainer = document.createElement('div');
        appIconConatainer.classList.add('default-item-icon');
        const appNameContainer = document.createElement('div');
        appNameContainer.classList.add('default-item-text');
        const tag = document.createElement('p');
        tag.textContent = app.name;
        appNameContainer.appendChild(tag);
        appContainer.appendChild(appIconConatainer);
        appContainer.appendChild(appNameContainer);
        container.appendChild(appContainer);
    });
}

// function to handle apps list
function selectApp(element) {
    // first remove all selected classes
    const selectedItems = document.querySelectorAll('.selected');
    selectedItems.forEach(item => {
        item.classList.remove('selected');
        setTimeout(() => {
            document.removeEventListener('keydown', handleEnterKey);
        }, 0);
    });

    element.classList.add('selected');
    
    function handleEnterKey(event){
        if(event.key === 'Enter'){
            const appName = document.querySelector('.selected p').textContent;
            window.hubbleAPI.openApp(appName);
        }
    }
    // add event listener for Enter key
    setTimeout(() => {
        document.removeEventListener('keydown', handleEnterKey);
        document.addEventListener('keydown', handleEnterKey);
    }, 0);
}
// function to handle search results
async function searchSystem(query){
    const searchResults =  await window.hubbleAPI.search(query);
    const searchResultsContainer = document.querySelector('.local-search-results');

    if(searchResults.message){
        searchResultsContainer.innerHTML = searchResults.message;
        return;
    }
    searchResultsContainer.innerHTML = '';
    const results = JSON.parse(searchResults);
    results.forEach(result => {
        const searchResultItem = document.createElement('div');
        const searchResultItemTitle = document.createElement('div');
        const searchResultItemContent = document.createElement('div');
        const searchResultItemIcon = document.createElement('div');

        searchResultItem.classList.add('local-search-results-item');
        searchResultItemTitle.classList.add('local-search-results-item-title');
        searchResultItemContent.classList.add('local-search-results-item-content');
        searchResultItemIcon.classList.add('local-search-results-item-icon');

        const icon = document.createElement('img');
        const fileExtension = result.path.split('.').pop();
        icon.src =  `./resources/filetypes/${fileExtension}.png`
        icon.onerror = (e) => {
            e.target.src = './resources/filetypes/default.png';
        }
        searchResultItemIcon.appendChild(icon);

        searchResultItemTitle.appendChild(searchResultItemIcon);
        searchResultItemTitle.appendChild(document.createTextNode(result.path.split('/').pop()));
        searchResultItemContent.textContent = result.path;
        searchResultItem.appendChild(searchResultItemTitle);
        searchResultItem.appendChild(searchResultItemContent);
        searchResultItem.addEventListener('click', () => {
            searchResultItem.classList.add('selected');
            window.hubbleAPI.openFile(result.path);
        });

        searchResultsContainer.appendChild(searchResultItem);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    getAppsList();

    // scrolling behaviour for arrow keys for apps list container
    const appchildHeight = document.querySelector('.default-item').offsetHeight;
    const container = document.querySelector('.default-container');
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            const selected = document.querySelector('.selected');
            if (selected) {
                const nextSibling = selected.nextElementSibling;
                if (nextSibling) {
                    selectApp(nextSibling);
                    container.scrollTop += appchildHeight;
                } 
            } else {
                const firstItem = document.querySelector('.default-item');
                if (firstItem) {
                    selectApp(firstItem);
                }
            }
        }
    });
    document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowUp') {
            const selected = document.querySelector('.selected');
            if (selected) {
                const previousSibling = selected.previousElementSibling;
                if (previousSibling) {
                    selectApp(previousSibling);
                    container.scrollTop -= appchildHeight;
                }
            } else {
                const lastItem = document.querySelector('.default-item:last-child');
                if (lastItem) {
                    selectApp(lastItem);
                }
            }
        }
    });

    // event listener for input field
    const searchInput = document.querySelector('.search-bar');
    searchInput.addEventListener('input', () => {
        // first remove all selected classes
        const selectedItems = document.querySelectorAll('.selected');
        selectedItems.forEach(item => {
            item.classList.remove('selected');
            setTimeout(() => {
                document.removeEventListener('keydown', handleEnterKey);
            }, 0);
        });
        const defaultContainer = document.getElementsByClassName('default-container')[0];
        const searchResults = document.getElementsByClassName('search-results-container')[0];
        defaultContainer.style.display = 'none';
        searchResults.style.display = 'flex';
        document.querySelector('.icon-container svg').style.color = 'white';
        searchSystem(searchInput.value);
    });
    // close the app if clicked outside the main container
    document.addEventListener('click', (event) => {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer.contains(event.target)) {
            window.hubbleAPI.hideHubble();
        }
    });
});
