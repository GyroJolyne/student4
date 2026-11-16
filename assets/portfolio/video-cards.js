// The fan animation can rebuild the cards, so handle activation on the page.
document.addEventListener("click", (event) => {
  const card = event.target.closest("#video-cards .callout-socials-card-w");
  const activeVideo = document.querySelector("#video-cards video[controls]");
  if (activeVideo && !card?.contains(activeVideo)) {
    activeVideo.pause();
    activeVideo.controls = false;
  }

  const launch = event.target.closest("#video-cards .video-launch");
  if (!launch) return;
  const video = card.querySelector("video");
  video.controls = true;
  video.focus({ preventScroll: true });
  video.play().catch(() => { /* Native controls remain available for retry. */ });
});
