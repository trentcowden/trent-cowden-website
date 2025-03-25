import { Section } from 'astro-boilerplate-components';

import Project from './Project';
import Tov from './Tov';
import Waha from './Waha';

const ProjectList = () => (
  <Section
    title={
      <>
        <p>Projects</p>
      </>
    }
  >
    <div className="flex flex-col gap-6">
      <Project
        href="https://apps.apple.com/us/app/tov-a-good-bible-app/id6482045395"
        description={
          <>
            Read Scripture in its purest form with Tov, a Bible app that brings
            focus and depth to your reading with its minimalist design and
            insightful cross-references.
          </>
        }
        name="Tov"
        svg={<Tov />}
      />
      <Project
        href="https://waha.app"
        description={
          <>
            Waha makes the Great Commission easy to understand and actionable
            for all believers, through its Disciple Making Course and Discovery
            Bible Study app.
          </>
        }
        name="Waha"
        svg={<Waha />}
      />
      <Project
        href="https://dashboard.waha.app"
        description={
          <>An analytics dashboard for viewing Waha usage around the globe.</>
        }
        name="Waha Dashboard"
        svg={<Waha />}
      />
    </div>
  </Section>
);

export { ProjectList };
