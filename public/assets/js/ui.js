import { stringify, parse } from "./utils.js";
import { log, hasCam, dlog, cap } from "./clientutils.js";
import {
  getElement,
  newElement,
  removeChildren,
  appendChild,
  addClickHandler,
  addHandler,
  addAttribute,
  countChildren,
  removeChild,
  append,
} from "./computils.js";

export const _updateUsersList = async (
  userList,
  listItemClickHandler,
  detectWebcam,
  blockUser
) => {
  const usersParent = document.querySelector("#users-parent");
  const currentUser = getElement("rmtid-input").value;

  // if (userList.length > 0) {
  removeChildren(usersParent);
  for (const user in userList) {
    const userObject = userList[user];

    if (userObject.online) {
      const blockedUsersIndex = userObject.blockedUsers.findIndex(
        (x) => x == currentUser
      );

      if (blockedUsersIndex == -1) {
        const blockedByIndex = userObject.blockedBy.findIndex(
          (x) => x == currentUser
        );

        if (blockedByIndex == -1) {
          // Create comps
          const card = newElement("div");
          const cardCol = newElement("div");
          const row = newElement("div");
          const imgCol = newElement("div");
          const cardImg = newElement("img");
          const bodyCol = newElement("div");
          const cardBody = newElement("div");
          const cardBodyLayout = newElement("div");
          const cardTitle = newElement("h5");
          const blockIcon = newElement("i");
          const acceptCallIcon = newElement("i");
          const connectTypeIcon = newElement("i");
          const divConnectIcon = newElement("div");
          const divBlockIcon = newElement("div");
          const divFriendIcon = newElement("div");

          const displayName = userObject.displayName.fname
            ? `${userObject.fname}`
            : `${userObject.uname}`;

          cardImg.alt = `${displayName}`;

          // Add attributes
          addAttribute(cardCol, "class", "col-12 col-md-4 col-lg-4");
          addAttribute(card, "class", "card mb-3");
          addAttribute(card, "id", `card-${userObject._id}`);
          addAttribute(row, "class", "row g-0 m-0 p-3");
          addAttribute(imgCol, "class", "col-6");
          addAttribute(bodyCol, "class", "col-6");
          addAttribute(
            cardBodyLayout,
            "class",
            "d-flex justify-content-center gap-5"
          );
          addAttribute(divConnectIcon, "class", "bg-light border rounded");
          addAttribute(divBlockIcon, "class", "bg-light border rounded");
          addAttribute(divFriendIcon, "class", "bg-light border rounded");
          addAttribute(cardImg, "class", "img-fluid rounded-start");
          addAttribute(cardBody, "class", "card-body");
          addAttribute(cardTitle, "class", "card-title text-center mb-4");
          addAttribute(blockIcon, "id", `block-${userObject._id}`);
          addAttribute(blockIcon, "class", "bi bi-eye-slash-fill");
          addAttribute(blockIcon, "data-toggle", "tooltip");
          addAttribute(blockIcon, "data-placement", "top");
          addAttribute(blockIcon, "data-html", "true");
          addAttribute(blockIcon, "title", `Block ${displayName}`);
          addAttribute(acceptCallIcon, "class", "bi bi-check-lg text-success");

          if (userObject.photoUrl) {
            cardImg.src = userObject.photoUrl;
          } else {
            cardImg.src = "/assets/graphics/silhouette.png";
          }

          // Append comps
          appendChild(usersParent, cardCol);
          appendChild(cardCol, card);
          appendChild(card, row);
          appendChild(row, imgCol);
          appendChild(row, bodyCol);
          appendChild(imgCol, cardImg);
          appendChild(bodyCol, cardBody);
          appendChild(cardBody, cardTitle);
          appendChild(cardBody, cardBodyLayout);
          appendChild(cardBodyLayout, connectTypeIcon);
          appendChild(cardBodyLayout, blockIcon);

          cardTitle.innerHTML = `<strong>${displayName}</strong>`;

          detectWebcam((results) => {
            if (!results) {
              addAttribute(connectTypeIcon, "id", `connect-${userObject._id}`);
              addAttribute(connectTypeIcon, "data-connectiontype", "audio");
              addAttribute(connectTypeIcon, "class", "bi bi-mic-fill");
              addAttribute(connectTypeIcon, "data-toggle", "tooltip");
              addAttribute(connectTypeIcon, "data-placement", "top");
              addAttribute(connectTypeIcon, "data-html", "true");
              addAttribute(
                connectTypeIcon,
                "title",
                `Connect with ${displayName}`
              );
            } else {
              addAttribute(connectTypeIcon, "id", `connect-${userObject._id}`);
              addAttribute(connectTypeIcon, "data-connectiontype", "video");
              addAttribute(connectTypeIcon, "class", "bi bi-camera-video-fill");
              addAttribute(connectTypeIcon, "data-toggle", "tooltip");
              addAttribute(connectTypeIcon, "data-placement", "top");
              addAttribute(connectTypeIcon, "data-html", "true");
              addAttribute(
                connectTypeIcon,
                "title",
                `Connect with ${displayName}`
              );
            }
          });

          // Register click handlers

          addClickHandler(connectTypeIcon, listItemClickHandler);

          addClickHandler(blockIcon, (e) => {
            const blockee = e.target.id.split("-")[1];
            const blocker = currentUser;
            blockUser(blocker, blockee);
          });
        }
      }
    }
  }
};

export const updateUsersList = async (
  userList,
  listItemClickHandler,
  detectWebcam,
  blockUser
) => {
  const usersParent = document.querySelector("#users-parent");
  const currentUser = getElement("rmtid-input").value;

  // if (userList.length > 0) {
  removeChildren(usersParent);
  for (const user in userList) {
    const userObject = userList[user];

    if (userObject.online) {
      const blockedUsersIndex = userObject.blockedUsers.findIndex(
        (x) => x == currentUser
      );

      if (blockedUsersIndex == -1) {
        const blockedByIndex = userObject.blockedBy.findIndex(
          (x) => x == currentUser
        );

        if (blockedByIndex == -1) {
          // Create comps
          const li = newElement("li");
          const liImg = newElement("img");
          const divName = newElement("div");
          const spanName = newElement("span");
          const divConnect = newElement("div");
          const iconConnect = newElement("i");
          const divBlock = newElement("div");
          const iconBlock = newElement("i");
          const spanConnect = newElement("span");
          const cardBody = newElement("div");
          const cardBodyLayout = newElement("div");
          const cardTitle = newElement("h5");
          const acceptCallIcon = newElement("i");
          const divConnectIcon = newElement("div");
          const divBlockIcon = newElement("div");
          const divFriendIcon = newElement("div");

          const displayName = userObject.displayName.fname
            ? `${userObject.fname}`
            : `${userObject.uname}`;

          liImg.alt = `${displayName}`;

          // Add attributes
          addAttribute(li, "class", "w3-bar w3-round-small");
          addAttribute(li, "id", `li-${userObject._id}`);
          addAttribute(li, "style", "position:relative;");

          addAttribute(liImg, "class", "w3-bar-item w3-circle");
          addAttribute(liImg, "style", "width:85px;margin:0;");
          addAttribute(liImg, "data-toggle", "tooltip");
          addAttribute(liImg, "data-placement", "top");
          addAttribute(liImg, "data-html", "true");
          addAttribute(liImg, "title", `${displayName}`);

          addAttribute(divName, "class", "w3-bar-item");
          addAttribute(divConnect, "class", "w3-bar-item");
          addAttribute(divBlock, "class", "w3-bar-item");

          addAttribute(iconBlock, "id", `block-${userObject._id}`);
          addAttribute(iconBlock, "class", "bi bi-eye-slash-fill");
          addAttribute(iconBlock, "data-toggle", "tooltip");
          addAttribute(iconBlock, "data-placement", "top");
          addAttribute(iconBlock, "data-html", "true");
          addAttribute(iconBlock, "title", `Block ${displayName}`);

          addAttribute(acceptCallIcon, "class", "bi bi-check-lg text-success");

          if (userObject.photoUrl) {
            liImg.src = userObject.photoUrl;
          } else {
            liImg.src = "/assets/graphics/silhouette.png";
          }

          // Append comps
          appendChild(usersParent, li);
          appendChild(li, liImg);
          appendChild(li, divName);
          appendChild(li, divConnect);
          appendChild(li, divBlock);
          appendChild(divName, spanName);
          appendChild(divConnect, iconConnect);
          appendChild(divBlock, iconBlock);

          spanName.innerHTML = `<strong>${displayName}</strong>`;

          detectWebcam((results) => {
            if (!results) {
              addAttribute(iconConnect, "id", `connect-${userObject._id}`);
              addAttribute(iconConnect, "data-connectiontype", "audio");
              addAttribute(iconConnect, "class", "bi bi-mic-fill");
              addAttribute(iconConnect, "data-toggle", "tooltip");
              addAttribute(iconConnect, "data-placement", "top");
              addAttribute(iconConnect, "data-html", "true");
              addAttribute(iconConnect, "title", `Connect with ${displayName}`);
            } else {
              addAttribute(iconConnect, "id", `connect-${userObject._id}`);
              addAttribute(iconConnect, "data-connectiontype", "video");
              addAttribute(iconConnect, "class", "bi bi-camera-video-fill");
              addAttribute(iconConnect, "data-toggle", "tooltip");
              addAttribute(iconConnect, "data-placement", "top");
              addAttribute(iconConnect, "data-html", "true");
              addAttribute(iconConnect, "title", `Connect with ${displayName}`);
            }
          });

          // Register click handlers

          addClickHandler(iconConnect, listItemClickHandler);

          addClickHandler(iconBlock, (e) => {
            const blockee = e.target.id.split("-")[1];
            const blocker = currentUser;
            blockUser(blocker, blockee);
          });
        }
      }
    }
  }
};

export const showMessage = (userDetails, iconClickHandler) => {
  const { userInfo, hasWebcam, messageBody, alertType } = userDetails;
  const messageParent = document.querySelector("#message-container");
  const alert = newElement("div");
  const alertCloseButton = newElement("button");
  const container = newElement("div");
  const row1 = newElement("div");
  const row2 = newElement("div");
  const row1Col = newElement("div");
  const row2Col = newElement("div");
  const row1P = newElement("p");
  const webcamIcon = newElement("i");
  const messageIcon = newElement("i");

  removeChildren(messageParent);

  /* Set attributes */

  // Alert attributes
  addAttribute(
    alert,
    "class",
    `alert ${alertType} d-flex align-items-center alert-dismissible fade show`
  );
  addAttribute(alert, "role", "alert");
  addAttribute(alert, "style", "display:inline-flex;");
  addAttribute(alert, "id", "alert");

  // Alert close button attributes
  addAttribute(alertCloseButton, "class", "btn-close");
  addAttribute(alertCloseButton, "type", "button");
  addAttribute(alertCloseButton, "data-bs-dismiss", "alert");
  addAttribute(alertCloseButton, "aria-label", "Close");

  // Container, rows and columns attributes
  addAttribute(container, "class", "container-fluid m-0 p-0");
  addAttribute(container, "style", "margin:0;padding:0;");
  addAttribute(row1, "class", "row m-0 p-0");
  addAttribute(row2, "class", "row m-0 p-0");
  addAttribute(row1Col, "class", "col-12 m-0 p-0");
  addAttribute(row2Col, "class", "col-12 m-0 p-0");

  // Icon attributes
  addAttribute(webcamIcon, "class", "bi bi-webcam-fill icon");
  addAttribute(webcamIcon, "id", `wc-${userInfo._id}`);
  addAttribute(messageIcon, "class", "bi bi-chat-left-dots-fill icon");
  addAttribute(messageIcon, "id", `mi-${userInfo._id}`);

  /* Append elements */

  // Append to view
  appendChild(messageParent, alert);

  // Append to alert
  appendChild(alert, container);
  appendChild(alert, alertCloseButton);

  // Append to container, rows and columns
  appendChild(container, row1);
  appendChild(container, row2);
  appendChild(row1, row1Col);
  appendChild(row2, row2Col);

  // Append elements
  appendChild(row1, row1P);

  // Detect user's webcam
  if (hasWebcam) {
    appendChild(row2Col, webcamIcon);
  } else {
    appendChild(row2Col, messageIcon);
  }

  // Set alert's title
  row1P.innerHTML = `${messageBody}`;

  addClickHandler(webcamIcon, iconClickHandler);
  addClickHandler(messageIcon, iconClickHandler);
};

export const showCallAlert = (userDetails) => {
  const { userInfo, alertType } = userDetails;
  const messageParent = document.querySelector("#message-container");
  const alert = newElement("div");
  const alertCloseButton = newElement("button");
  const strong = newElement("strong");
  const p = newElement("p");

  dlog(`Alert Type:\t${alertType}`, `ui.js: showCallAlert`);

  /* Set attributes */

  // Alert attributes
  addAttribute(
    alert,
    "class",
    `alert ${alertType} d-flex align-items-center alert-dismissible fade show`
  );
  addAttribute(alert, "role", "alert");
  addAttribute(alert, "style", "display:inline-flex;");
  addAttribute(alert, "id", "alert");

  // Paragraph element
  addAttribute(p, "style", "display:inline-flex;");

  // Alert close button attributes
  addAttribute(alertCloseButton, "class", "btn-close");
  addAttribute(alertCloseButton, "type", "button");
  addAttribute(alertCloseButton, "data-bs-dismiss", "alert");
  addAttribute(alertCloseButton, "aria-label", "Close");

  // Alert title
  strong.innerHTML = `... Calling ${cap(userInfo.fname)}`;

  /* Append elements */

  // Append to view
  appendChild(messageParent, alert);

  // Append to alert
  appendChild(p, strong);
  appendChild(alert, p);
  appendChild(alert, alertCloseButton);

  setTimeout(() => {
    alert.remove();
  }, [4000]);
};

export const showCallResponse = (userDetails) => {
  const { receiver, response, alertType } = userDetails;
  const messageParent = document.querySelector("#message-container");
  const alert = newElement("div");
  const alertCloseButton = newElement("button");
  const strong = newElement("strong");

  /* Set attributes */

  // Alert attributes
  addAttribute(
    alert,
    "class",
    `alert ${alertType} d-flex align-items-center alert-dismissible fade show`
  );
  addAttribute(alert, "role", "alert");
  addAttribute(alert, "style", "display:inline-flex;");
  addAttribute(alert, "id", "alert");

  // Alert close button attributes
  addAttribute(alertCloseButton, "class", "btn-close");
  addAttribute(alertCloseButton, "type", "button");
  addAttribute(alertCloseButton, "data-bs-dismiss", "alert");
  addAttribute(alertCloseButton, "aria-label", "Close");

  // Alert title
  strong.innerHTML = `${cap(
    receiver.fname
  )} ${response} your connection request`;

  /* Append elements */

  // Append to view
  appendChild(messageParent, alert);

  // Append to alert
  appendChild(alert, strong);
  appendChild(alert, alertCloseButton);

  setTimeout(() => {
    alert.remove();
  }, [7000]);
};

export const showMediaControls = (micControlHandler, videoControlHandler) => {
  const parent = getElement("local-media-controls-parent");
  const container = newElement("div");
  const nav = newElement("nav");
  const containerFluid = newElement("div");
  const ul = newElement("ul");
  const liRecord = newElement("li");
  const liMicrophone = newElement("li");
  const liVideo = newElement("li");
  const liScreenShare = newElement("li");
  const recordIcon = newElement("i");
  const microphoneIcon = newElement("i");
  const videoIcon = newElement("i");
  const screenshareIcon = newElement("i");

  // Add attributes
  addAttribute(container, "class", "container");
  addAttribute(nav, "class", "navbar navbar-expand bg-light");
  addAttribute(containerFluid, "class", "container-fluid");

  // List
  addAttribute(ul, "class", "navbar-nav position-relative controls");

  // List items
  addAttribute(liRecord, "class", "mx-4  d-flex align-items-center");
  addAttribute(liMicrophone, "class", "mx-4  d-flex align-items-center");
  addAttribute(liVideo, "class", "mx-4 a d-flex align-items-center");
  addAttribute(liScreenShare, "class", "mx-4  d-flex align-items-center");

  // Icons
  addAttribute(recordIcon, "class", "mx-4 bi bi-record");
  addAttribute(microphoneIcon, "class", "mx-4 bi bi-mic-fill");
  addAttribute(videoIcon, "class", "mx-4 bi bi-camera-video-fill");
  addAttribute(screenshareIcon, "class", "mx-4 bi bi-window-stack");

  // Append comps
  appendChild(parent, container);
  appendChild(container, nav);
  appendChild(nav, containerFluid);
  appendChild(containerFluid, ul);
  appendChild(ul, recordIcon);
  appendChild(ul, microphoneIcon);
  appendChild(ul, videoIcon);
  appendChild(ul, screenshareIcon);

  /*   appendChild(liRecord, recordIcon);
  appendChild(liMicrophone, microphoneIcon);
  appendChild(liVideo, videoIcon);
  appendChild(liScreenShare, screenshareIcon); */

  // Register click events
  addClickHandler(microphoneIcon, micControlHandler);
  addClickHandler(videoIcon, videoControlHandler);
};

export const _showCallRequest = (userDetails, acceptCall) => {
  const { user, conntype, callee } = userDetails;
  const name = user.fname;
  const msg = `${name} wants to connect`;
  const messageParent = getElement("my-body");

  // Elements
  const alert = newElement("div");
  const container1 = newElement("div");
  const container1Message = newElement("div");
  const container2 = newElement("div");
  const img = newElement("img");
  const para = newElement("p");
  const acceptButton = newElement("button");
  const alertCloseButton = newElement("span");

  dlog(
    `${name} is requesting a ${conntype} connection with you`,
    "ui.js: showCallRequest"
  );
  dlog(`user object: ${stringify(user)}`, "ui.js: showCallRequest");
  dlog(`callee object: ${stringify(callee)}`, "ui: showCallRequest");

  if (user.photoUrl) {
    img.src = user.photoUrl;
  } else {
    img.src = "/assets/graphics/silhouette.png";
  }

  // Element Attributes
  addAttribute(
    alert,
    "class",
    "w3-panel w3-border w3-border-blue w3-card-4 w3-round w3-center w3-display-container"
  );
  addAttribute(alertCloseButton, "class", "w3-button w3-display-topright");
  addAttribute(container1, "class", "w3-cell-row");
  addAttribute(container2, "class", "w3-cell-row");
  addAttribute(container2, "style", "margin:5px 0px;");
  addAttribute(container1Message, "class", "w3-display-container");
  addAttribute(
    img,
    "class",
    "w3-image thumbnail w3-display-topleft w3-margin 0"
  );
  addAttribute(para, "class", "w3-display-topcenter w3-margin 0");
  addAttribute(acceptButton, "class", "w3-cell-middle");
  addAttribute(img, "style", "max-width:calc(100vw / 10);margin:0;");
  addAttribute(
    acceptButton,
    "class",
    "w3-button w3-border w3-border-green w3-tiny"
  );

  // Element Inner Text
  acceptButton.innerText = `Ok`;
  para.innerText = `${name} wants to connect with you`;

  // Element Inner HTML
  alertCloseButton.innerHTML = `&times;`;

  // Append Elements
  appendChild(messageParent, alert);
  appendChild(container1Message, img);
  appendChild(container1Message, para);
  appendChild(container1, container1Message);
  appendChild(container1, alertCloseButton);
  appendChild(container2, acceptButton);
  appendChild(alert, container1);
  appendChild(alert, container2);

  // Register accept button click handler
  addClickHandler(acceptButton, () => {
    acceptCall(user._id, callee, conntype);
  });

  addClickHandler(alertCloseButton, (e) => {
    const target = e.target;
    const parent = target.parentElement;
    const grandParent = parent.parentElement;
    grandParent.remove();
  });
};

export const __showCallRequest = (userDetails, acceptCall) => {
  const { user, conntype, callee } = userDetails;
  const name = user.fname;
  const msg = `${name} wants to connect`;
  const messageParent = getElement(`li-${callee.trim()}`)
    ? getElement(`li-${callee.trim()}`).parentElement
    : getElement("my-body");

  // Elements
  const alert = newElement("div");
  const container1 = newElement("div");
  const container1Message = newElement("div");
  const container2 = newElement("div");
  const img = newElement("img");
  const para = newElement("p");
  const acceptButton = newElement("button");
  const alertCloseButton = newElement("span");

  dlog(
    `${name} is requesting a ${conntype} connection with you`,
    "ui.js: showCallRequest"
  );
  dlog(`user object: ${stringify(user)}`, "ui.js: showCallRequest");
  dlog(`callee object: ${stringify(callee)}`, "ui: showCallRequest");

  if (user.photoUrl) {
    img.src = user.photoUrl;
  } else {
    img.src = "/assets/graphics/silhouette.png";
  }

  // Element Attributes
  addAttribute(
    alert,
    "class",
    "w3-panel w3-border w3-border-blue w3-card-4 w3-round w3-center w3-display-container"
  );
  addAttribute(alertCloseButton, "class", "w3-button w3-display-topright");
  addAttribute(container1, "class", "w3-cell-row");
  addAttribute(container2, "class", "w3-cell-row");
  addAttribute(container2, "style", "margin:5px 0px;");
  addAttribute(container1Message, "class", "w3-display-container");
  addAttribute(img, "class", "w3-image w3-margin 0");
  addAttribute(para, "class", "w3-display-topcenter w3-margin 0");
  addAttribute(acceptButton, "class", "w3-cell-middle");
  addAttribute(img, "style", "max-width:calc(100vw / 10);margin:0;");
  addAttribute(
    acceptButton,
    "class",
    "w3-button w3-border w3-border-green w3-tiny"
  );

  // Element Inner Text
  acceptButton.innerText = `Ok`;
  para.innerText = `${name} wants to connect with you`;

  // Element Inner HTML
  alertCloseButton.innerHTML = `&times;`;

  // Append Elements
  appendChild(messageParent, alert);
  appendChild(container1Message, img);
  appendChild(container1Message, para);
  appendChild(container1, container1Message);
  appendChild(container1, alertCloseButton);
  appendChild(container2, acceptButton);
  appendChild(alert, container1);
  appendChild(alert, container2);

  // Register accept button click handler
  addClickHandler(acceptButton, () => {
    acceptCall(user._id, callee, conntype);
  });

  addClickHandler(alertCloseButton, (e) => {
    const target = e.target;
    const parent = target.parentElement;
    const grandParent = parent.parentElement;
    grandParent.remove();
  });
};

export const showCallRequest = (userDetails, acceptCall) => {
  const { user, conntype, callee } = userDetails;
  const name = user.fname;
  const msg = `${name} wants to connect`;
  dlog(`${msg}`, `ui.js: showCallRequest`);

  const li = getElement(`li-${user.uid}`);

  if (li) {
    const divMsg = newElement("div");
    const divButtons = newElement("div");
    const panel = newElement("div");
    const acceptButton = newElement("button");
    const closeButton = newElement("span");
    const para = newElement("p");

    // Element Attributes
    addAttribute(divMsg, "class", "w3-cell-row");
    addAttribute(divButtons, "class", "w3-mobile w3-cell-middle");
    addAttribute(panel, "class", "w3-panel w3-round-large");
    addAttribute(
      closeButton,
      "class",
      "w3-button w3-display-topright w3-text-white w3-background-transparent w3-round-large w3-hover-red"
    );
    addAttribute(closeButton, "style", "background-color:rgba(10,10,10,0.5);");
    addAttribute(
      panel,
      "style",
      "background-color:rgba(10,10,10,0.5);background-size:cover;position:absolute;left:0;top:0;height:100%;width:100%;margin:0;"
    );
    addAttribute(para, "class", "w3-text-white w3-center");
    addAttribute(
      acceptButton,
      "class",
      "w3-button w3-text-white w3-border w3-border-white w3-round-large w3-hover-green"
    );
    addAttribute(acceptButton, "style", "background:transparent;");

    // Inner Text
    para.innerText = `${name} wants to connect`;
    closeButton.innerHTML = `&times;`;
    acceptButton.innerText = `Ok`;

    // Append Elements
    appendChild(li, panel);
    appendChild(panel, divMsg);
    appendChild(panel, closeButton);
    appendChild(panel, divButtons);
    appendChild(divButtons, acceptButton);
    appendChild(divMsg, para);

    // Register click handler
    addClickHandler(acceptButton, () => {
      acceptCall(user._id, callee, conntype);
    });

    addClickHandler(closeButton, (e) => {
      const target = e.target;
      const parent = target.parentElement;
      // const grandParent = parent.parentElement;
      parent.remove();
    });
  }
};
