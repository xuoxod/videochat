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

import { cloakMe, uncloakMe } from "./__wss.js";

export const updateUsersList = async (
  userList,
  listItemClickHandler,
  detectWebcam,
  blockUser,
  blockedBy
) => {
  const usersParent = document.querySelector("#users-parent");
  const currentUser = getElement("rmtid-input").value;

  // if (userList.length > 0) {
  removeChildren(usersParent);
  for (const user in userList) {
    const userObject = userList[user];

    if (userObject.isVisible) {
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
          const parentRow = newElement("div");
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
          addAttribute(parentRow, "class", "col-12 col-md-4 col-lg-4");
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
          appendChild(usersParent, parentRow);
          appendChild(parentRow, card);
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

            dlog(`${blocker} blocked ${blockee}`, `ui script: line 156`);
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
  strong.innerHTML = `... Calling ${cap(userInfo.fname)}`;

  /* Append elements */

  // Append to view
  appendChild(messageParent, alert);

  // Append to alert
  appendChild(alert, strong);
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

export const showCallRequest = (userDetails, acceptCall) => {
  const { user, conntype, callee } = userDetails;
  const name = user.fname;
  const msg = `${name} wants to connect`;
  const messageParent = getElement("my-body");

  // Conatiners
  const alert = newElement("div");
  const container = newElement("div");
  const imgCol = newElement("div");
  const paraCol = newElement("div");
  const acceptButtonCol = newElement("div");
  const imgColRow = newElement("div");
  const acceptButtonColRow = newElement("div");
  const paraColRow = newElement("div");

  // Elements
  const img = newElement("img");
  const para = newElement("p");
  const acceptButton = newElement("button");
  const closeButton = newElement("button");

  dlog(`${name} is requesting a ${conntype} connection with you`, "ui script");
  dlog(`user props: ${stringify(user)}`, "ui script");
  dlog(`callee object: ${stringify(callee)}`, "ui script");

  if (user.photoUrl) {
    img.src = user.photoUrl;
  } else {
    img.src = "/assets/graphics/silhouette.png";
  }

  // Conatiners
  addAttribute(
    alert,
    "class",
    "alert alert-primary alert-dismissible fade show d-inline-flex w-25 p-10"
  );
  addAttribute(alert, "role", "alert");
  addAttribute(alert, "style", "display:inline-block;position:absolute;");
  addAttribute(container, "class", "container");
  addAttribute(container, "style", "display:inline-grid;margin:0");
  addAttribute(imgColRow, "class", "row");
  addAttribute(paraColRow, "class", "row");
  addAttribute(acceptButtonColRow, "class", "row");
  addAttribute(imgCol, "class", "col-auto");
  addAttribute(paraCol, "class", "col-auto");
  addAttribute(acceptButtonCol, "class", "col-auto");

  // Elements
  addAttribute(img, "class", "img-fluid rounded-50 w-100 h-100 m-0");
  addAttribute(
    img,
    "style",
    "max-width:50%; max-height: 70%; margin:0; display:inline-block;"
  );
  addAttribute(para, "class", "text-center text-wrap");
  addAttribute(acceptButton, "type", "button");
  addAttribute(acceptButton, "class", "btn btn-success");
  addAttribute(closeButton, "type", "button");
  addAttribute(closeButton, "class", "btn-close");
  addAttribute(closeButton, "data-bs-dismiss", "alert");
  addAttribute(closeButton, "aria-label", "Close");

  appendChild(container, imgColRow);
  appendChild(container, paraColRow);
  appendChild(container, acceptButtonColRow);
  appendChild(imgColRow, imgCol);
  appendChild(paraColRow, paraCol);
  appendChild(acceptButtonColRow, acceptButtonCol);
  appendChild(alert, container);
  appendChild(alert, closeButton);
  appendChild(messageParent, alert);
  appendChild(imgCol, img);
  appendChild(paraCol, para);
  appendChild(acceptButtonCol, acceptButton);

  para.innerText = `${msg}`;
  acceptButton.innerText = `Ok`;

  // Register click handlers
  addClickHandler(acceptButton, () => {
    acceptCall(user._id, callee, conntype);
  });
};

if (getElement("isvisible") && getElement("hideme")) {
  const isVisible = getElement("isvisible").value.trim() == "true";
  const hidemeLink = getElement("hideme");

  if (!isVisible) {
    hidemeLink.removeEventListener("click", cloakMe);
    addClickHandler(hidemeLink, uncloakMe);
  } else {
    hidemeLink.removeEventListener("click", uncloakMe);
    addClickHandler(hidemeLink, cloakMe);
  }
}
