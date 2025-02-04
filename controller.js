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
        const img = document.createElement('img');
        //img.src = './resources/applications/chrome.png';

        //appIconConatainer.appendChild(img);
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

//=======================================================
// auxilliary function for adding search option
function addSearchOption(searchResultsContainer, searchQuery){
    const searchResultItem = document.createElement('div');
    const searchResultItemTitle = document.createElement('div');
    const searchResultItemContent = document.createElement('div');
    const searchResultItemIcon = document.createElement('div');

    searchResultItem.classList.add('local-search-results-item');
    searchResultItemTitle.classList.add('local-search-results-item-title');
    searchResultItemContent.classList.add('local-search-results-item-content');
    searchResultItemIcon.classList.add('local-search-results-item-icon');

    const icon = document.createElement('img');
    icon.src =  `./resources/filetypes/web.png`
    icon.onerror = (e) => {
        e.target.src = './resources/filetypes/default.png';
    }
    searchResultItemIcon.appendChild(icon);
    searchResultItemTitle.appendChild(searchResultItemIcon);
    searchResultItemTitle.appendChild(document.createTextNode(`Search for "${searchQuery}"`));
    searchResultItemContent.textContent = `Answers from the web for "${searchQuery}"`;
    searchResultItem.appendChild(searchResultItemTitle);
    searchResultItem.appendChild(searchResultItemContent);
    searchResultItem.addEventListener('click', () => {
        searchResultItem.classList.add('selected');
        window.hubbleAPI.searchWeb(searchQuery);
    });
    searchResultsContainer.appendChild(searchResultItem);

    // adding an onclick event listener
    searchResultItem.addEventListener('click', () => {
        const webContainer = document.querySelector('.websearch-container');
        webContainer.style.display = 'flex';
        queryWeb(webContainer,searchQuery);
    });
}

// function to get web search from duck duck go
async function queryWeb(container,query){
    const webResults = await window.hubbleAPI.searchWeb(query);
    container.innerHTML = '';
    webResults.results.forEach(result => {
        // creating the divs
        const webResultItem = document.createElement('div');
        const webResultItemTitle = document.createElement('div');
        const webResultItemTitleIcon = document.createElement('div');
        const webResultItemTitleContent = document.createElement('div');
        const webResultItemTitleContentTitle = document.createElement('div');
        const webResultItemTitleContentHost = document.createElement('div');
        const webResultItemContent = document.createElement('div');
        const webResultItemContentDesc = document.createElement('div');

        // adding classes
        webResultItem.classList.add('websearch-result-item');
        webResultItemTitle.classList.add('websearch-result-item-title');
        webResultItemTitleIcon.classList.add('websearch-result-item-title-icon');
        webResultItemTitleContent.classList.add('websearch-result-item-title-content');
        webResultItemTitleContentTitle.classList.add('websearch-result-item-title-content-text');
        webResultItemTitleContentHost.classList.add('websearch-result-item-title-content-host');
        webResultItemContent.classList.add('websearch-result-item-content');
        webResultItemContentDesc.classList.add('websearch-result-item-content-desc');

        // adding content
        const icon = document.createElement('img');
        icon.src = result.icon;
        webResultItemTitleIcon.appendChild(icon);
        webResultItemTitleContentTitle.textContent = result.title;
        webResultItemTitleContentHost.textContent = result.hostname;

        webResultItemTitleContent.appendChild(webResultItemTitleContentTitle);
        webResultItemTitleContent.appendChild(webResultItemTitleContentHost);
        webResultItemTitle.appendChild(webResultItemTitleIcon);
        webResultItemTitle.appendChild(webResultItemTitleContent);

        webResultItemContentDesc.innerHTML = result.description;
        webResultItemContent.appendChild(webResultItemContentDesc);

        webResultItem.appendChild(webResultItemTitle);
        webResultItem.appendChild(webResultItemContent);

        // add event listener when clicked on the item to open link in browser
        webResultItem.addEventListener('click', () => {
            window.hubbleAPI.openWebLink(result.url);
            window.hubbleAPI.hideHubble();
        });

        container.appendChild(webResultItem);

    })
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
    // also add a web search option
    addSearchOption(searchResultsContainer, query);
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
        searchSystem(searchInput.value);
    });

    // hide the app if clicked outside the main container
    document.addEventListener('click', (event) => {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer.contains(event.target)
            && !document.querySelector('.websearch-container').contains(event.target)) {
            window.hubbleAPI.hideHubble();
        }
    });
});
