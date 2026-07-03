function selectPlan(planName, planPrice) {
    // Show form section
    document.getElementById('membership-form-section').style.display = 'block';
    
    // Scroll to form
    document.getElementById('membership-form-section').scrollIntoView({ behavior: 'smooth' });

    // Set selected plan value
    document.getElementById('selectedPlan').value = planName + " (J$" + planPrice.toLocaleString() + ")";
  }

  document.getElementById('membershipForm').addEventListener('submit', function(e){
    e.preventDefault();

    const paymentMethod = document.getElementById('paymentMethod').value;
    if(paymentMethod === "card") {
      // Redirect to payment gateway (Stripe, PayPal, etc.)
      alert("Redirecting to secure payment gateway for card payment...");
      window.location.href = "/payment-page.html"; // Replace with your payment gateway link
    } else {
      alert("Thank you! Your membership has been registered. You chose to pay in person.");
      // Optional: send data to your server
      this.reset();
    }
  });


 // 1. Toggle the main mobile menu
        document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
            document.querySelector('.nav-container').classList.toggle('mobile-active');
        });
    
        // 2. Toggle dropdowns on click for mobile
        document.querySelectorAll('.mobile-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault(); // Prevents following the link
                this.parentElement.nextElementSibling.style.display = 
                    (this.parentElement.nextElementSibling.style.display === 'block') ? 'none' : 'block';
            });
        });

        // Toggle sub-menus when clicking "About Us" or "Portal Login" on mobile
        document.querySelectorAll('.dropdown > a, .portal-trigger').forEach(item => {
            item.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    let subMenu = this.nextElementSibling;
                    // Toggle display
                    subMenu.style.display = (subMenu.style.display === 'block') ? 'none' : 'block';
                }
            });
        });