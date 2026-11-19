
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Մենք ստեղծում ենք երրորդ աղյուսակ՝ enrollments, որը իրար է կապում Ուսանողին և Դասընթացին՝ օգտագործելով Foreign Keys (Օտար Բանալիներ):

-- ON DELETE CASCADE: Եթե մենք ջնջենք դասընթացը կամ ուսանողին, այս գրանցումը ավտոմատ կջնջվի։
-- PRIMARY KEY (user_id, course_id): Սա կոչվում է Composite Key։ Սա երաշխավորում է, որ նույն ուսանողը չի կարող 2 անգամ գրանցվել նույն դասընթացին։ Բազան անմիջապես Error կտա (Data Integrity):

CREATE TABLE enrollments (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);


ALTER TABLE users 
ADD COLUMN theme VARCHAR(10) DEFAULT 'light';


CREATE TABLE course_likes (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);


CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE users 
ADD COLUMN avatar_url TEXT DEFAULT 'https://ui-avatars.com/api/?name=User&background=random';


CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500), -- YouTube հղումի համար (կարող է դատարկ լինել)
    content TEXT, -- Տեքստային նյութի համար
    order_index INTEGER DEFAULT 0, -- Դասավորությունը (1, 2, 3...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);