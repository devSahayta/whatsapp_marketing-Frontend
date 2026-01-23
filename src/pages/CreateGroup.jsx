//pages/CreateGroup.jsx
import React from "react";
import EventForm from "../components/GroupForm";
import "../styles/pages.css";
import "../styles/createGroup.css"; // 👈 new CSS
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

// 👇 import image
import createGroupImg from "../assets/images/create-group1.jpg";

const CreateEvent = () => {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  if (isLoading) return <p>Loading authentication...</p>;
  if (!isAuthenticated || !user) return <p>Please log in to create a group</p>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create New Group</h1>
        <p className="page-subtitle">Set up your group and upload guest data</p>
      </div>

      {/* 👇 NEW LAYOUT */}
      <div className="create-group-layout">
        {/* Left Image */}
        <div className="create-group-image">
          <img src={createGroupImg} alt="Create Group Illustration" />
        </div>

        {/* Right Form */}
        <div className="create-group-form">
          <EventForm user={user} />
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

// // pages/CreateGroup.jsx
// import React from "react";
// import EventForm from "../components/GroupForm";
// import "../styles/pages.css";
// import "../styles/createGroup.css";
// import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

// // Import image
// import createGroupImg from "../../public/images/create-group2.jpg";

// const CreateEvent = () => {
//   const { user, isAuthenticated, isLoading } = useKindeAuth();

//   if (isLoading) return <p>Loading authentication...</p>;
//   if (!isAuthenticated || !user)
//     return <p>Please log in to create a group</p>;

//   return (
//     <div className="create-group-layout">
//       {/* Left Image - Full Height */}
//       <div className="create-group-image">
//         <img src={createGroupImg} alt="Create Group Illustration" />
//       </div>

//       {/* Right Form Section */}
//       <div className="create-group-form">
//         {/* Header at the top */}
//         <div className="page-header">
//           <h1 className="page-title">Create New Group</h1>
//           <p className="page-subtitle">
//             Set up your campaign group and upload participant data
//           </p>
//         </div>

//         {/* Form centered below header */}
//         <div className="create-group-form-wrapper">
//           <EventForm user={user} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateEvent;
