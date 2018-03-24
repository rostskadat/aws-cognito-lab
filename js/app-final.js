// Self-invoking anonymous function
(function($) {
	'use strict';

	var cognitoUser;

	// Click event listeners
	$('#btnSignUp').click(function() {
	  signUp();
	});

	$('#btnSignIn').click(function() {
	  signIn();
	});

	$('#btnSignOut').click(function() {
	  signOut();
	});

	$('#btnUpdate').click(function() {
	  updateProfile();
	});

	$('#forgotPassword').click(function() {
	  forgotPassword();
	});

	$('#btnS3').click(function() {
	  createObject();
	});


	// Region must be defined
	AWS.config.region = 'us-east-1';

	// User pool
	var poolData = {
			UserPoolId : 'us-east-1_MYnlnSKp6', // Your user pool id here
			ClientId : '5d3s9jg6k9rupvjddl0rjr7h8j' // Your app client id here
	};

	// Identity pool
	var identityPoolId = "us-east-1:eba34910-30e3-4b75-8540-8ee026e6c442"

	// Sign Up
	function signUp(){
		console.log('Starting Sign up process');

		// Get sign up information from modal
		var userLogin = {
			username : $('#inputPreferredUsername').val(),
			password : $('#inputPassword').val()
		}

		var attributes = [
			{
				Name : 'given_name',
				Value : $('#inputGivenName').val()
			},
			{
					Name : 'family_name',
					Value : $('#inputFamilyName').val()
			},
			{
					Name : 'email',
					Value : $('#inputEmail').val()
			},
			{
					Name : 'preferred_username',
					Value : $('#inputPreferredUsername').val()
			},
			{
					Name : 'website',
					Value : $('#inputWebsite').val()
			},
			{
					Name : 'gender',
					Value : $('#inputGender').val()
			},
			{
					Name : 'birthdate',
					Value : $('#inputBirthdate').val()
			},
			{
					Name : 'custom:linkedin',
					Value : $('#inputLinkedin').val()
			}
		];

		console.log("Adding attributes");

		var attributeList = [];
		for (var a=0; a<attributes.length; ++a){
	    var attributeTemp = new AmazonCognitoIdentity.CognitoUserAttribute(attributes[a]);
	    attributeList.push(attributeTemp);
		}
		console.log("Signing up");
		$('#signUpModal').modal("hide"); // Close the modal window
		var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    userPool.signUp(userLogin.username, userLogin.password, attributeList, null, function(err, result){
      if (err) {
				if (err.message == "200") // http 200 OK response, signup pending verfication
					bootbox.alert('Please check your email for a verification link.');
				else
					bootbox.alert(JSON.stringify(err.message)); // there is a problem
      	return;
      }
      cognitoUser = result.user; // this response will not occur if signup pending verfication
      console.log('user name is ' + cognitoUser.getUsername());
			bootbox.alert('Please check your email for a verification link.');
    });
	}

	// Sign In
	function signIn(){
		var authenticationData = {
			Username : $('#inputUsername').val(), // Get username & password from modal
			Password : $('#inputPassword2').val()
	  };
		$('#signInModal').modal("hide"); // Close the modal window
	  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
	  var userData = {
			Username : authenticationData.Username,
			Pool : userPool
	  };
	  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	  cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: function (result) {
				createCredentials(result.getIdToken().getJwtToken());
				console.log("Signed in successfully");
	    },
	    onFailure: function(err) {
				if (err.message == '200'){  // 200 Success return
					cognitoUser = userPool.getCurrentUser();
					if (cognitoUser != null) {
						cognitoUser.getSession(function (err, result) { // Get ID token from session
			        if (err) {
								alert(err);
			        }
			        if (result) {
								createCredentials(result.getIdToken().getJwtToken());
								console.log("Signed in successfully");
			        }
			    	});
					}
					else {
						alert(JSON.stringify(err));
					}
				}
				else {
					alert(JSON.stringify(err));
				}
	    },
	  });
	}

	function createCredentials(idToken) {
		AWS.config.credentials = new AWS.CognitoIdentityCredentials({
			IdentityPoolId: identityPoolId,
			Logins : {
				// Change the key below according to the specific region your user pool is in.
				'cognito-idp.us-east-1.amazonaws.com/us-east-1_MYnlnSKp6' : idToken
			}
		});
		//refreshes credentials using AWS.CognitoIdentity.getCredentialsForIdentity()
		AWS.config.credentials.refresh((error) => {
				if (error) {
						 console.error(error);
				} else {
						 // Instantiate aws sdk service objects now that the credentials have been updated.
						 // example: var s3 = new AWS.S3();
						 console.log('Successfully logged!');
				}
		});
	}

	function signOut() {
		if (cognitoUser != null) {
			bootbox.confirm({
				title: "Sign out",
		    message: "Do you want to also invalidate all user data on this device?",
		    buttons: {
		        cancel: {
		            label: '<i class="fa fa-times"></i> No'
		        },
		        confirm: {
		            label: '<i class="fa fa-check"></i> Yes'
		        }
			    },
		    callback: function (result) {
					if (result) {
						cognitoUser.globalSignOut({
							onSuccess: function (result) {
								bootbox.alert("Successfully signed out and invalidated all app records.");
							},
							onFailure: function(err) {
								alert(JSON.stringify(err));
							}
						});
					}
					else {
						cognitoUser.signOut();
						bootbox.alert("Signed out of app.");
					}
		    }
			});
		}
		else {
			bootbox.alert("You are not signed in!");
		}
	}

function updateProfile(){
	if (cognitoUser != null) {
		console.log('Starting update process');

		var attributes = [
			{
				Name : 'given_name',
				Value : $('#inputGivenName2').val()
			},
			{
					Name : 'family_name',
					Value : $('#inputFamilyName2').val()
			},
			{
					Name : 'email',
					Value : $('#inputEmail2').val()
			},
			{
					Name : 'website',
					Value : $('#inputWebsite2').val()
			},
			{
					Name : 'gender',
					Value : $('#inputGender2').val()
			},
			{
					Name : 'birthdate',
					Value : $('#inputBirthdate2').val()
			},
			{
					Name : 'custom:linkedin',
					Value : $('#inputLinkedin2').val()
			}
		];

		console.log("Adding attributes");
		var attributeList = [];
		for (var a=0; a<attributes.length; ++a){
	    var attributeTemp = new AmazonCognitoIdentity.CognitoUserAttribute(attributes[a]);
	    attributeList.push(attributeTemp);
		}
		console.log("Updating profile");
		$('#updateModal').modal("hide"); // Close the modal window
		cognitoUser.updateAttributes(attributeList, function(err, result) {
        if (err) {
            alert(JSON.stringify(err.message));
            return;
        }
        console.log('call result: ' + JSON.stringify(result));
				bootbox.alert("Successfully updated!");
	    });
		}
		else {
			bootbox.alert("You are not signed in!");
		}
	}

	function forgotPassword(){
		var verificationCode, newPassword, forgotUser;
		console.log('Forgot Password');
		bootbox.prompt("Enter username or email", function(result){
			console.log("User: " + result);
			forgotUser = result;
			var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
			var userData = {
				Username : forgotUser,
				Pool : userPool
		  };
			console.log("Creating user " + JSON.stringify(userData));
		  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
			cognitoUser.forgotPassword({
	        onSuccess: function (data) {
	            // successfully initiated reset password request
		          console.log('CodeDeliveryData from forgotPassword: ' + data);
	        },
	        onFailure: function(err) {
	            console.log(JSON.stringify(err.message));
	        },
	        //Optional automatic callback
	        inputVerificationCode: function(data) {
	            console.log('Code sent to: ' + JSON.stringify(data));
							bootbox.prompt('Please input verification code', function(result){
								verificationCode = result;
								bootbox.prompt('Enter new password ', function(result){
									newPassword = result;
									cognitoUser.confirmPassword(verificationCode, newPassword, {
			                onSuccess() {
			                    console.log('Password confirmed!');
													bootbox.alert('Password confirmed!');
			                },
			                onFailure(err) {
			                    console.log(JSON.stringify(err.message));
			                }
			            });
								});
							});
	        }
	    });
		});
	}

	function createObject(){
		if (cognitoUser != null) {
			console.log("Creating S3 object");
			var identityId = AWS.config.credentials.identityId;
			var prefix = 'cognito/backspace-academy/' + identityId;
			var key = prefix + '/' +  'test' + '.json';
			console.log('Key: ' + key)
			var data = {
				'test': 'It worked!'
			}
			var temp = JSON.stringify(data);
			var bucketName = 'backspace-lab-pcoady';
	    var objParams = {
	        Bucket: bucketName,
	        Key: key,
	        ContentType: 'json',
	        Body: temp
	    };
			// Save data to S3
			var s3 = new AWS.S3({
			    params: {
			        Bucket: bucketName
			    }
			});
			s3.putObject(objParams, function (err, data) {
	        if (err) {
	            console.log('Error saving to cloud: ' + err);
	            alert('danger','Error.','Unable to save data to S3.');
	        } else {
	          alert('success','Finished','Data saved to S3.');
	        }
	    });

		}
		else {
			bootbox.alert('You are not signed in!');
		}
	}

// End 	self-invoking anonymous function
})(jQuery);