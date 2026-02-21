<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<script type="text/javascript">
	// making the CAPTCHA  a required field for form submission
    $(document).ready(function(){
        $("#reg-form").on("submit", function(evt){
            var response = grecaptcha.getResponse();
            if(response.length == 0){
                //reCaptcha not verified
                alert("Please verify you are humann!");
                evt.preventDefault();
                return false;
            }
            //captcha verified
            //do the rest of your validations here
            $("#reg-form").submit();
        });
    });
</script>