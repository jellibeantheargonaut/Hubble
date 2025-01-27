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
        const icon = document.createElement('img');
        icon.src = 'data/icon.png';
        tag.textContent = app.name;
        appIconConatainer.appendChild(icon);
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
        document.removeEventListener('keydown', handleEnterKey);
    });

    element.classList.add('selected');
    
    function handleEnterKey(event){
        if(event.key === 'Enter'){
            const appName = document.querySelector('.selected p').textContent;
            window.hubbleAPI.openApp(appName);
        }
    }
    // add event listener for Enter key
    //document.removeEventListener('keydown', handleEnterKey);
    document.addEventListener('keydown', handleEnterKey);
}

document.addEventListener('DOMContentLoaded', () => {
    getAppsList();

    // scrolling behaviour for arrow keys
    const childHeight = document.querySelector('.default-item').offsetHeight;
    const container = document.querySelector('.default-container');
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            const selected = document.querySelector('.selected');
            if (selected) {
                const nextSibling = selected.nextElementSibling;
                if (nextSibling) {
                    selectApp(nextSibling);
                    container.scrollTop += childHeight;
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
                    container.scrollTop -= childHeight;
                }
            } else {
                const lastItem = document.querySelector('.default-item:last-child');
                if (lastItem) {
                    selectApp(lastItem);
                }
            }
        }
    });
    // close the app if clicked outside the main container
    document.addEventListener('click', (event) => {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer.contains(event.target)) {
            window.hubbleAPI.closeApp();
        }
    });
});
