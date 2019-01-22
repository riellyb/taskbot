/**
 * Responds to an ADDED_TO_SPACE event in Hangouts Chat.
 * @param {object} event the event object from Hangouts Chat
 * @return {object} JSON-formatted response
 * @see https://developers.google.com/hangouts/chat/reference/message-formats/events
 */
function onAddToSpace(event) {
  console.info(event);
  var message = 'Thank you for adding me to ';
  if (event.space.type === 'DM') {
    message += 'a DM, ' + event.user.displayName + '!';
  } else {
    message += event.space.displayName;
  }
  return { text: message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Hangouts Chat.
 * @param {object} event the event object from Hangouts Chat
 * @see https://developers.google.com/hangouts/chat/reference/message-formats/events
 */
function onRemoveFromSpace(event) {
  console.info(event);
  console.log('Bot removed from ', event.space.name);
}

/**
 * Creates a card-formatted response.
 * @param {object} widgets the UI components to send
 * @param {object} header the Header to send
 * @param {object} update whether or not to create a new card or update
 * @return {object} JSON-formatted response
 */
function createCardResponse(widgets, header, update) {
  return {
    actionResponse: {
      type: update ? 'UPDATE_MESSAGE' : 'NEW_MESSAGE'
    },
    cards: [header, {
      sections: [{
        widgets: widgets
      }]
    }]
  };
}

/**
 * Responds to a MESSAGE event triggered in Hangouts Chat.
 * @param {object} event the event object from Hangouts Chat
 * @return {object} JSON-formatted response
 */
function onMessage(event) {
  console.info(event);
  var name = event.user.displayName;
  var params = event.message.text.split(' ');

  for (var i = 0; i < params.length; i++) {
    if (params[i] === 'cr') {
      return handleCodeReview(params[2], name)
    } else if (params[i] === 'nasa') {
      return handleNasa();
    }
  }
  var message = 'Not a valid command! Try: "cr jira.endurance.com/mycrticket"';
  return { text: message };
}

/**
 * Responds to a CARD_CLICKED event triggered in Hangouts Chat.
 * @param {object} event the event object from Hangouts Chat
 * @return {object} JSON-formatted response
 * @see https://developers.google.com/hangouts/chat/reference/message-formats/events
 */
function onCardClick(event) {
  console.info(event);
  var user = event.user;
  var url = event.action.parameters[0].value;
  var userName = event.action.parameters[1].value;
  if (event.action.actionMethodName == 'assignTask') {
    return assignTask(url, user, userName);
  } else if (event.action.actionMethodName == 'completeTask') {
    return completeTask(url, user, userName);
  }
}

/**
 * Creates a code review Task
 * @param {string} url is the link to the code review task
 * @param {string} name is the name of the user who created the task
 * @return {object} JSON-formatted card
 */
function handleCodeReview(url, name) {

  // if (!isURL(url)) {
  //   var message = 'cr command second param must be a valid URL.';
  //   return { text: message };
  // }
  var header = {
    header: {
      title: 'CR Task - ' + name,
      subtitle: url
    }
  };
  var widgets = [{
    buttons: [{
      textButton: {
        text: 'Take Task',
        onClick: {
          action: {
            actionMethodName: 'assignTask',
            parameters: [{
              key: 'url',
              value: url
            },
            {
              key: 'userName',
              value: name
            }]
          }
        }
      }
    },
    {
      textButton: {
        text: 'Open in JIRA',
        onClick: {
          'openLink': {
            'url': url
          }
        }
      }
    }]
  }];
  return createCardResponse(widgets, header, false);
}

/**
 * Assigns a code review Task
 * @param {string} url is the link to the code review task
 * @param {object} user is the user who clicked the button
 * @param {string} userName is the user who created the task
 */
function assignTask(url, user, userName) {
  var name = user.displayName;
  // if (userName === name) {
  //   var message = 'You cannot assign yourself to a task you created!';
  //   return { text: message };
  // }
  var header = {
    header: {
      title: 'CR Task - ' + userName,
      subtitle: 'This tasked is assigned to ' + name
    }
  };
  var widgets = [{
    textParagraph: {
      text: url
    }
  },
  {
    buttons: [{
      textButton: {
        text: 'Complete Task',
        onClick: {
          action: {
            actionMethodName: 'completeTask',
            parameters: [{
              key: 'url',
              value: url
            },
            {
              key: 'userName',
              value: userName
            }]
          }
        }
      }
    }]
  },
  {
    buttons: [{
      textButton: {
        text: 'Open in JIRA',
        onClick: {
          'openLink': {
            'url': url
          }
        }
      }
    }]
  }];
  return createCardResponse(widgets, header, true);

}

/**
 * Completes a code review Task
 * @param {string} url is the link to the code review task
 * @param {string} user is the user who clicked the button
 * @param {string} userName is the user who created the task
 */
function completeTask(url, user, userName) {
  var name = user.displayName;
  var header = {
    header: {
      title: 'Task Complete!'
    }
  };
  var widgets = [
    {
      "textParagraph": {
        "text": name + " completed CR task for " + userName + "<br>" + url
      }
    }
    ,
    {
      buttons: [{
        textButton: {
          text: 'Go to CR task',
          onClick: {
            'openLink': {
              'url': url
            }
          }
        }
      }]
    }];
  return createCardResponse(widgets, header, true);

}

/**
 * Checks if str is a valid URL
 * @param {string} str is the url to check
 * @return {boolean} whether or not str is a valid URL
 */
function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?' + // port
    '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
    '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
}

/**
 * Creates a card for the NASA APOD
 * @return {object} JSON formatted card with current APOD
 */
function handleNasa() {
  var json = getNasaImage();
  var image = json.data.url;
  var description = data.explanation;
  var URL = 'https://apod.nasa.gov/apod/astropix.html';

  var header = {
    header: {
      title: 'NASA Photo of the day - ',
      subtitle: description
    }
  };
  var widgets = [
    {
      "image": {
        "imageUrl": image
      }
    },
    {
      "buttons": [
        {
          "textButton": {
            "text": "See more",
            "onClick": {
              "openLink": {
                "url": URL
              }
            }
          }
        }
      ]
    }];
  return createCardResponse(widgets, header);
}

/**
 * Calls the APOD API and returns the data
 * @return {object} JSON with APOD response
 */
function getNasaImage() {
  var API_KEY = "hXzesYGE9ncom0t4kCvrD4mfOuBPWRWrSLNfv89w";
  var API_URL = 'https://api.nasa.gov/planetary/apod?api_key=' + API_KEY;

  var myRequest = new Request(API_URL);

  fetch(myRequest)
    .then(function (data) {
      return data.json();
    }).then(function (res) {
      console.log(res);
    });
}

/**
 * Creates today's date in the format mm/dd/yyyy
 * @return {str} today's date formatted
 */
function getToday() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  return mm + '/' + dd + '/' + yyyy;
}
