/**
 * ============================================================
 *  PORTFOLIO DATA — the ONLY file you need to edit for content.
 * ============================================================
 *  Everything below comes from the resume. Leave a link as ''
 *  and it is hidden automatically.
 *
 *  - Change profile photo : drop a file named  profile.jpg|png|webp
 *                           into  src/assets/images/
 *  - Add a project        : add an object to `projects` below
 *                           (screenshot: src/assets/images/projects/<id>.jpg)
 *  - Change GitHub link   : edit `social.github`
 */
import type { Education, Project, SkillCategory } from './types'

export const portfolioData = {
  /* ---------- Identity ---------- */
  name: 'AARYAN BORICHA',
  firstName: 'Aaryan',
  title: 'B.Tech CSE Student | Web Developer',
  location: 'Vadodara',

  /** Short intro in the hero (condensed from the resume profile) */
  intro:
    'Computer Science undergraduate with a strong interest in software development, frontend development and AI/ML — building practical skills in programming, web development and problem-solving.',

  /** Full profile text from the resume (About section) */
  bio:
    'Computer Science undergraduate with a strong interest in software development, frontend development and AI/ML. Familiar with modern web technologies and currently developing practical skills in programming, web development and problem-solving. Seeking an internship opportunity to gain industry experience and contribute to real-world software projects.',

  seeking: 'Internship opportunity',

  /* ---------- Education ---------- */
  education: {
    degree: 'B.Tech — Computer Science & Engineering',
    university: 'GSFC University',
    location: 'Vadodara',
    period: '2026 – Present',
    status: 'Currently pursuing 3rd Semester',
  } as Education,

  /* ---------- Technical skills (exactly as in the resume) ---------- */
  skills: [
    { id: 'languages', label: 'Languages', items: ['C', 'C++', 'Python'] },
    { id: 'web', label: 'Web Development', items: ['HTML', 'CSS', 'JavaScript', 'React.js'] },
    { id: 'backend', label: 'Backend & Database', items: ['Node.js', 'REST APIs', 'Supabase'] },
    { id: 'tools', label: 'Tools', items: ['Git', 'GitHub', 'VS Code'] },
  ] as SkillCategory[],

  /* ---------- Projects ----------
   * Add more objects here; the 3D journey, layout and scroll length adapt automatically.
   */
  projects: [
    {
      id: 'personal-portfolio',
      name: 'Personal Portfolio Website',
      type: 'Web · Frontend',
      description:
        'Designed and developed a responsive personal portfolio website to showcase skills, projects and experience. Implemented interactive UI components, animations and responsive layouts. Focused on clean design, usability and cross-device compatibility.',
      technologies: [], // The resume does not list technologies for this project.
      highlights: ['Responsive layouts', 'Interactive UI components', 'Animations', 'Cross-device compatibility'],
      github: '',
      liveDemo: '',
      planet: 'ice',
    },
    {
      id: 'web-development-projects',
      name: 'Web Development Projects',
      type: 'Web · Practice work',
      description: 'A collection of web interfaces built while learning modern frontend development.',
      points: [
        'Built multiple responsive web interfaces using HTML, CSS, JavaScript and React.',
        'Practised component-based development, API integration and frontend problem-solving.',
        'Used Git and GitHub for version control and project management.',
      ],
      technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'GitHub'],
      github: '',
      liveDemo: '',
      planet: 'desert',
    },
  ] as Project[],

  /* ---------- Career interests ---------- */
  interests: ['Software Development', 'Frontend Development', 'Full-Stack Development', 'AI/ML', 'Data Science'],

  /* ---------- Contact & links ---------- */
  contact: {
    email: 'borichaaaryan21@gmail.com',
    // The resume shows "+123-456-7890", which looks like a placeholder, so it is not displayed.
    // Add your real number here to show it in the Contact section.
    phone: '',
  },
  social: {
    github: '', // e.g. 'https://github.com/your-username'
    linkedin: '', // e.g. 'https://www.linkedin.com/in/your-id'
    other: [] as { label: string; url: string }[],
  },
}
