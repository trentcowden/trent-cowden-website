import { HeroAvatar, Section } from 'astro-boilerplate-components';

const Hero = () => (
  <Section>
    <HeroAvatar
      title={
        <>
          Hi there, I'm <a className="text-p1">Trent</a>! 👋
        </>
      }
      description={
        <>
          Firstly, a follower of <strong className="text-p1">Jesus</strong>.
          Secondly, a full-stack developer with a passion for{' '}
          <strong className="text-p1">simplicity</strong> and{' '}
          <strong className="text-p1">usability</strong>. I currently work at{' '}
          <a className="font-bold text-p1 underline" href="https://waha.app">
            Waha
          </a>{' '}
          as the lead developer.
        </>
      }
      avatar={
        <img
          className="size-64 resize-none rounded-full border-2 border-ph shadow-lg"
          src="/assets/images/avatar.jpeg"
          alt="Avatar image"
          loading="lazy"
        />
      }
      socialButtons={null}
    />
    <div className="mb-8 flex flex-row">
      <svg
        className="mr-2 size-6 text-fg2"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p className="text-fg2">Seattle, WA</p>
    </div>
  </Section>
);

export { Hero };
