import React from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";

const NotFound: React.FC = () => (
  <div className="page">
    <PageHeader title="Page not found" intro="This address doesn't match any page on the site.">
      <Link to="/" className="link mt-6 inline-block">
        Go to the home page
      </Link>
    </PageHeader>
  </div>
);

export default NotFound;
