document.addEventListener("DOMContentLoaded", function (event) {
    // Dark theme
    var prevActiveTheme = localStorage.getItem("theme-color");
    document.documentElement.setAttribute("data-theme", prevActiveTheme ? prevActiveTheme : "light");
    var themeToggle = document.getElementsByClassName('theme-color-toggle')[0];
    themeToggle.onclick = function () {
        var currentTheme = document.documentElement.getAttribute("data-theme");
        var switchToTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme-color", switchToTheme)
        document.documentElement.setAttribute("data-theme", switchToTheme);
    }

    // Soft interaction sounds. Audio is generated locally after the visitor's
    // first interaction, so no sound file has to be loaded.
    var audioContext;
    var lastHoveredControl;
    var interactiveSelector = 'a, button, input[type="submit"], .theme-color-toggle, .mobile-menu-toggle, .logo, .slider-navigation .prev, .slider-navigation .next, .companies-list li';

    function playInteractionSound(type) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioContext = audioContext || new AudioContext();
        if (audioContext.state !== 'running') {
            audioContext.resume()
                .then(function () { playInteractionSound(type); })
                .catch(function () { /* The browser requires a click before audio can play. */ });
            return;
        }

        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        var now = audioContext.currentTime;
        var frequency = type === 'click' ? 430 : 620;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * .8, now + .055);
        gain.gain.setValueAtTime(.0001, now);
        gain.gain.exponentialRampToValueAtTime(type === 'click' ? .035 : .018, now + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .075);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + .08);
    }

    document.addEventListener('pointerover', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var control = e.target.closest(interactiveSelector);
        if (!control || control === lastHoveredControl) return;
        lastHoveredControl = control;
        playInteractionSound('hover');
    });
    document.addEventListener('pointerout', function (e) {
        if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(interactiveSelector)) {
            lastHoveredControl = null;
        }
    });
    document.addEventListener('click', function (e) {
        if (e.target.closest(interactiveSelector)) playInteractionSound('click');
    });
    document.addEventListener('focusin', function (e) {
        if (e.target.matches(interactiveSelector)) playInteractionSound('hover');
    });

    // Interactive abstract dot field, rendered behind the page content.
    var dotsCanvas = document.querySelector('.dots-background');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (dotsCanvas) {
        var dotsContext = dotsCanvas.getContext('2d');
        var dots = [];
        var pointer = { x: -1000, y: -1000 };
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        function createDots() {
            var area = window.innerWidth * window.innerHeight;
            var count = Math.max(24, Math.min(70, Math.floor(area / 18000)));
            dots = Array.from({ length: count }, function () {
                return {
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    vx: (Math.random() - .5) * .22,
                    vy: (Math.random() - .5) * .22,
                    radius: Math.random() * 2 + 1
                };
            });
        }

        function resizeDots() {
            dotsCanvas.width = window.innerWidth * pixelRatio;
            dotsCanvas.height = window.innerHeight * pixelRatio;
            dotsContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            createDots();
        }

        function drawDots() {
            var darkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            var dotColor = darkTheme ? 'rgba(177, 170, 255, .42)' : 'rgba(103, 91, 228, .62)';
            var lineColor = darkTheme ? 'rgba(177, 170, 255, .12)' : 'rgba(103, 91, 228, .24)';
            dotsContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

            dots.forEach(function (dot, index) {
                var dx = dot.x - pointer.x;
                var dy = dot.y - pointer.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (!reduceMotion && distance < 130) {
                    dot.x += (dx / distance || 0) * .7;
                    dot.y += (dy / distance || 0) * .7;
                }
                if (!reduceMotion) {
                    dot.x += dot.vx;
                    dot.y += dot.vy;
                    if (dot.x < -10 || dot.x > window.innerWidth + 10) dot.vx *= -1;
                    if (dot.y < -10 || dot.y > window.innerHeight + 10) dot.vy *= -1;
                }

                dotsContext.beginPath();
                dotsContext.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                dotsContext.fillStyle = dotColor;
                dotsContext.fill();

                for (var next = index + 1; next < dots.length; next++) {
                    var near = dots[next];
                    var xDistance = dot.x - near.x;
                    var yDistance = dot.y - near.y;
                    if (xDistance * xDistance + yDistance * yDistance < 10500) {
                        dotsContext.beginPath();
                        dotsContext.moveTo(dot.x, dot.y);
                        dotsContext.lineTo(near.x, near.y);
                        dotsContext.strokeStyle = lineColor;
                        dotsContext.lineWidth = .6;
                        dotsContext.stroke();
                    }
                }
            });

            if (!reduceMotion) window.requestAnimationFrame(drawDots);
        }

        window.addEventListener('pointermove', function (e) {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        });
        window.addEventListener('resize', resizeDots);
        resizeDots();
        drawDots();
    }

    // Let the hanging ID card respond gently to the cursor.
    var idFrame = document.querySelector('.hero-section .image');
    var idCard = document.querySelector('.hero-section .id-card');
    if (idFrame && idCard && !reduceMotion) {
        idFrame.addEventListener('pointermove', function (e) {
            var bounds = idFrame.getBoundingClientRect();
            var rotateY = ((e.clientX - bounds.left) / bounds.width - .5) * 10;
            var rotateX = ((e.clientY - bounds.top) / bounds.height - .5) * -8;
            idCard.style.setProperty('--rotate-x', rotateX.toFixed(2) + 'deg');
            idCard.style.setProperty('--rotate-y', rotateY.toFixed(2) + 'deg');
        });
        idFrame.addEventListener('pointerleave', function () {
            idCard.style.setProperty('--rotate-x', '0deg');
            idCard.style.setProperty('--rotate-y', '0deg');
        });
    }
    // AOS
    AOS.init({
        once: true,
        offset: 10,
        duration: 600,
        easing: 'cubic-bezier(0.42, 0, 0.12, 1.28)'
    });
    // kursor
     new kursor({
         type: 4,
         color: '#7E74F1'
     });
    // SVG Sprite Support
    svg4everybody();
    // CSS Var support
    cssVars({});
    // Sticky Menu
    var menu = document.getElementsByClassName("header")[0];
    if (window.pageYOffset >= 32) { // fix middle load page issue
        menu.classList.add('sticky');
    }
    var lastScroll = 0;
    window.addEventListener("scroll", function () {
        var currentScroll = window.pageYOffset;
        if (currentScroll <= 32) {
            menu.classList.remove('sticky');
            return;
        } else {
            menu.classList.add('sticky');
        }
        lastScroll = currentScroll;
    });
    // Smooth scroll
    document.querySelectorAll('.header .nav .nav-links a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth',
                block: "start"
            });
        });
    });
    // Active section
    var sections = document.querySelectorAll("section");
    var navLi = document.querySelectorAll(".header .nav .nav-links li");
    window.onscroll = function () {
        var current = "";
        sections.forEach((section) => {
            var sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 282) {
                current = section.getAttribute("id");
            }
        });
        navLi.forEach((li) => {
            li.classList.remove("active");
            if (li.classList.contains(current)) {
                li.classList.add("active");
            }
        });
    };
    // Back to top
    var trigger = document.getElementsByClassName('logo')[0];
    trigger.onclick = function () {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
    // Mobile menu
    var mobileMenuToggle = document.getElementsByClassName('mobile-menu-toggle')[0];
    mobileMenuToggle.onclick = function () {
        document.querySelector(".header .nav .nav-links").classList.toggle('active');
    }
    // Portfolio slider
    var numberOfSlides = document.querySelectorAll('.swiper-slide').length;
    new Swiper('.swiper', {
        loop: false,
        allowSlidePrev: numberOfSlides !== 1,
        allowSlideNext: numberOfSlides !== 1,
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 16,
            },
            769: {
                slidesPerView: 2,
                spaceBetween: 32,
            },
            1151: {
                slidesPerView: 3,
                spaceBetween: 56,
            },
        },
        navigation: {
            nextEl: '.slider-navigation .next',
            prevEl: '.slider-navigation .prev',
        },
    });
    // Experiences
    document.querySelector(".experience-section .companies-list").addEventListener('click', function (e) {
        e.preventDefault();
        if (e.target.tagName === 'LI') {
           window.innerWidth > 992 ? document.querySelector(".experience-section .selector").style.top = e.target.offsetTop + 'px' : null;
            document.querySelector(".experience-section .companies-list li.active").classList.remove('active')
            e.target.classList.add('active');
            var targetTab = e.target.getAttribute('data-tab');
            if (targetTab) {
                document.querySelector(".experience-section .content.active").classList.remove('active')
                document.getElementById(targetTab).classList.add('active')
            }
        }
    });
    // Skill
    var bars = document.querySelectorAll(".progress-bar .main-bar .fill");
    window.addEventListener('scroll', function () {
        if (isInViewport(document.getElementsByClassName('progress-bar-wrapper')[0])) {
            bars.forEach(item => {
                if (isInViewport(item)) {
                    item.style.width = item.getAttribute('data-width') + '%';
                }
            })
        }
    });

    function isInViewport(el) {
        var rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Contact Form
    function validateForm() {
        if (document.contactForm.name.value == '') {
            document.querySelector('.validation-error.name').classList.add('active')
            document.contactForm.name.focus();
            return false;
        } else {
            document.querySelector('.validation-error.name').classList.remove('active')
        }
        var emailRegex = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;
        if (document.contactForm.email.value == '' || !document.contactForm.email.value.match(emailRegex)) {
            document.querySelector('.validation-error.email').classList.add('active')
            document.contactForm.email.focus();
            return false;
        } else {
            document.querySelector('.validation-error.email').classList.remove('active')
        }
        if (document.contactForm.message.value == '') {
            document.querySelector('.validation-error.message').classList.add('active')
            document.contactForm.message.focus();
            return false;
        } else {
            document.querySelector('.validation-error.message').classList.remove('active')
        }
        return true;
    }
    document.contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateForm()) {
            var formElements = document.contactForm.elements;
            var formData = {};
            for (var i = 0; i < formElements.length; i++) {
                if (formElements[i].name && formElements[i].value) {
                    formData[formElements[i].name] = formElements[i].value
                }
            }
            var raw = JSON.stringify(formData);
            var requestOptions = {
                method: 'POST',
                body: raw,
                redirect: 'follow'
            };
            document.getElementsByClassName("submit-btn")[0].classList.add('show-loading');
            fetch("https://contact-form.devchapter-work.workers.dev", requestOptions)
                .then(response => response.text())
                .then(result => {
                    document.getElementsByClassName("submit-btn")[0].classList.remove('show-loading')
                    document.getElementsByClassName('success-submit-message')[0].classList.add('active')
                    document.contactForm.reset();
                    setTimeout(function () {
                        document.getElementsByClassName('success-submit-message')[0].classList.remove('active')
                    }, 4000)
                })
                .catch(error => {
                    document.getElementsByClassName("submit-btn")[0].classList.remove('show-loading')
                    document.getElementsByClassName('fail-submit-message')[0].classList.add('active');
                    setTimeout(function () {
                        document.getElementsByClassName('fail-submit-message')[0].classList.remove('active')
                    }, 4000)
                });
        }
    })
    document.contactForm.addEventListener('change', function (e) {
        e.preventDefault();
        document.querySelectorAll('.validation-error').forEach(function (el) {
            el.classList.remove('active')
        })
    })
    // Copyright
    var currentYear = new Date().getFullYear();
    var copyrightText = document.querySelector(".footer .copyright .year").innerHTML
    document.querySelector(".footer .copyright .year").innerHTML = copyrightText.replace('year', currentYear);
})
