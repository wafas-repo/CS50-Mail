document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_mail;

  const tabs = document.querySelectorAll('[data-tab-target]')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(tab => {
        tab.classList.remove('active')
      })
      tab.classList.add('active')
    })
  })

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  const tabs = document.querySelectorAll('[data-tab-target]')
  const def = document.querySelector('#default')
  tabs.forEach(tab => {
      tabs.forEach(tab => {
        tab.classList.remove('active')
    })
  })


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';



  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails);
      emails.forEach(email => {

        const sender = email.sender;
        const subject = email.subject;
        const timestamp = email.timestamp;

        let email_element = document.createElement('div');
        email_element.classList.add('div-email');

        // changes sent email color too ----- need to limit to inbox only if possible z
        if ((mailbox === 'inbox' || mailbox === 'archive') && email.read === true) {
            email_element.style.backgroundColor = "#cc527a63";
        } 

        if(mailbox === 'inbox'){
          const tabs = document.querySelectorAll('[data-tab-target]')
          const def = document.querySelector('#default')
          tabs.forEach(tab => {
              tabs.forEach(tab => {
                tab.classList.remove('active')
            })
          })

          def.classList.add('active')         
        }

        email_element.innerHTML = `<div class="d-1">${sender}</div>
        <div class="d-1">${subject}</div>
        <div class="d-3">${timestamp}</div>`;

        document.querySelector('#emails-view').append(email_element);

        email_element.addEventListener('click', () => view_email(email, mailbox));

      });
   
  });
} 

function view_email(email, mailbox) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#email-view').innerHTML = '';


  fetch(`/emails/${email["id"]}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  fetch(`/emails/${email["id"]}`)
  .then(response => response.json())
  .then(email => {

    let email_div = document.createElement('div');
    email_div.classList.add('email-container');

    var from = document.createElement("p");
    var to = document.createElement("p");
    var subject = document.createElement("p");
    var timestamp = document.createElement("p");
    var x = document.createElement("HR");
    from.innerHTML = "From: " + `${email["sender"]}`;
    to.innerHTML = "To: " + `${email["recipients"]}`;
    subject.innerHTML = "Subject: " + `${email["subject"]}`;
    timestamp.innerHTML = "Timestamp: " + `${email["timestamp"]}`;

    let reply_btn = document.createElement("Button");
    reply_btn.innerHTML = "Reply";
    reply_btn.setAttribute("id", "reply_btn");
    let archive_btn = document.createElement("Button");
    if (email["archived"]) {
      archive_btn.innerHTML += "Unarchive";
    } else {
      archive_btn.innerHTML += "Archive";
    }
    archive_btn.setAttribute("id", "archive_btn");

    email_div.appendChild(from);
    email_div.appendChild(to);
    email_div.appendChild(subject);
    email_div.appendChild(timestamp);
    email_div.appendChild(reply_btn);
    email_div.appendChild(archive_btn);
    email_div.appendChild(x);

    document.querySelector('#email-view').append(email_div);

    if (mailbox === 'sent') {
      document.getElementById('reply_btn').style.visibility = 'hidden';
      document.getElementById('archive_btn').style.visibility = 'hidden';
    }

    archive_btn.addEventListener('click', () => archive(email));
    reply_btn.addEventListener('click', () => reply(email));

    var body = document.createElement("P");
    body.innerHTML = `${email["body"]}`;
    document.querySelector('#email-view').append(body);


  });

}

function send_mail() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
      
  })
  .catch(error => {
    console.log('Error:', error);
  });

  return false;
  
}

function archive(email) {

  fetch(`/emails/${email["id"]}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email["archived"]
    })
  })
  .then(() => {
    load_mailbox("inbox");
  });

}

function reply(email) {

  compose_email();

  document.getElementById('compose-recipients').value = email["sender"];
  document.getElementById('compose-subject').value = "Re: " + email.subject;
  document.getElementById('compose-body').value = " \n \n \n ----On " + email.timestamp + " " +  email.sender + " wrote:---- \n \n" + email.body;
  
}

